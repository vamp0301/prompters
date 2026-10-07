import type { SeedTopicContent } from "./types.js";

/**
 * Stage 1A (Python fundamentals, part 1) and Stage 2 (DSA patterns, part 1).
 * Default teaching language: Hinglish.
 */
export const topics: SeedTopicContent[] = [
  {
    slug: "py-variables-types",
    estMinutes: 35,
    difficulty: 1,
    prerequisites: ["how-code-runs"],
    objectives: [
      "Create variables and explain that a Python name is a label pointing to an object",
      "Identify the core types int, float, str, bool and None and check them with type()",
      "Convert between types safely with int(), float(), str() and bool()",
      "Avoid classic beginner traps like '5' + 5, float precision and shadowing built-in names",
    ],
    technicalDefinition: "A Python variable is a name bound to an object in memory; every object carries its own type (int, float, str, bool, NoneType, ...), and types are checked at runtime (dynamic, strong typing).",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Variable** ek naam hai jo kisi value ko point karta hai — jaise \`age = 21\`. Left side pe naam, right side pe value, beech mein \`=\`.

Python mein har value ka ek **data type** hota hai:
- \`int\` — poore number, jaise \`21\`
- \`float\` — decimal wale, jaise \`8.7\`
- \`str\` — text, jaise \`"Rahul"\`
- \`bool\` — sirf \`True\` ya \`False\`
- \`None\` — matlab "abhi kuch nahi hai"

Tumhe type batana nahi padta — Python value dekh ke khud samajh leta hai. Isko **dynamic typing** kehte hain. Kabhi doubt ho toh \`type(x)\` likho, Python bata dega.`,
          en: `A **variable** is a name that refers to a value, like \`age = 21\`. The name goes on the left, the value on the right, with \`=\` in between.

Every value in Python has a **data type**:
- \`int\` for whole numbers like \`21\`
- \`float\` for decimals like \`8.7\`
- \`str\` for text like \`"Rahul"\`
- \`bool\` for \`True\` or \`False\`
- \`None\` for "no value yet"

You never declare the type. Python works it out from the value, which is called **dynamic typing**. Use \`type(x)\` to check any value's type.`,
          hi: `**वेरिएबल** एक नाम है जो किसी वैल्यू की तरफ इशारा करता है — जैसे \`age = 21\`। बाईं तरफ नाम, दाईं तरफ वैल्यू, और बीच में \`=\`।

Python में हर वैल्यू का एक **डेटा टाइप** होता है:
- \`int\` — पूर्ण संख्या, जैसे \`21\`
- \`float\` — दशमलव वाली संख्या, जैसे \`8.7\`
- \`str\` — टेक्स्ट, जैसे \`"Rahul"\`
- \`bool\` — सिर्फ़ \`True\` या \`False\`
- \`None\` — "अभी कुछ नहीं"

आपको टाइप बताना नहीं पड़ता — Python वैल्यू देखकर खुद समझ लेता है। इसे **डायनामिक टाइपिंग** कहते हैं। \`type(x)\` से आप कभी भी टाइप देख सकते हैं।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Mummy ki kitchen socho. Wahan dabbe rakhe hain aur har dabbe pe **label** chipka hai — "cheeni", "chai patti", "namak".

- **Label** = variable ka naam (\`sugar\`)
- **Dabbe ke andar ka saaman** = value (\`2\` chammach)
- **Saaman ki category** = data type (cheeni gin sakte ho → \`int\`, recipe ka naam padh sakte ho → \`str\`)

Python mein ek mazedaar twist hai: label dabbe pe chipka hai, dabba label ke andar nahi hai. Agar tum likho \`b = a\`, toh tumne naya dabba nahi banaya — bas **dusra label usi dabbe pe chipka diya**. Aur jab tum \`a = a + 1\` karte ho, toh Python naya dabba banata hai aur \`a\` wala label utha ke naye dabbe pe laga deta hai. Purana dabba \`b\` ke paas reh jaata hai.`,
          en: `Picture the jars in a kitchen, each with a **label**: "sugar", "tea", "salt".

- The **label** is the variable name (\`sugar\`)
- **What is inside the jar** is the value (\`2\` spoons)
- **The kind of thing inside** is the data type (countable → \`int\`, a recipe name → \`str\`)

In Python the label is stuck on the jar, not the other way round. Writing \`b = a\` does not create a new jar; it sticks a **second label on the same jar**. Writing \`a = a + 1\` creates a new jar and moves the \`a\` label onto it, while \`b\` still points to the old one.`,
          hi: `माँ की रसोई सोचिए। वहाँ डिब्बे रखे हैं और हर डिब्बे पर **लेबल** लगा है — "चीनी", "चाय पत्ती", "नमक"।

- **लेबल** = वेरिएबल का नाम (\`sugar\`)
- **डिब्बे के अंदर का सामान** = वैल्यू (\`2\` चम्मच)
- **सामान की किस्म** = डेटा टाइप (गिन सकते हैं → \`int\`, नाम पढ़ सकते हैं → \`str\`)

Python में लेबल डिब्बे पर चिपका होता है। \`b = a\` लिखने से नया डिब्बा नहीं बनता — बस **उसी डिब्बे पर दूसरा लेबल** लग जाता है। और \`a = a + 1\` करने पर Python नया डिब्बा बनाता है और \`a\` का लेबल उस पर लगा देता है, जबकि \`b\` पुराने डिब्बे पर ही रहता है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Bina variables ke program ek calculator jaisa hota jo kuch yaad nahi rakhta. Socho Zomato pe tumne 3 items cart mein daale — app ko total, coupon, address sab **yaad** rakhna hai. Ye yaad rakhna variables karte hain.

Aur **types** kyun? Kyunki same operation alag type pe alag kaam karta hai:
- \`5 + 5\` → \`10\` (numbers jud gaye)
- \`"5" + "5"\` → \`"55"\` (text chipak gaya)
- \`"5" + 5\` → **TypeError** (Python confuse — text mein number kaise jode?)

Type batata hai ki value ke saath kya-kya kar sakte ho. Form se aaya "21" ek string hai; usse age calculate karni hai toh pehle \`int("21")\` karna padega. Ye samajh nahi hai toh har dusre din bug aayega.`,
          en: `Without variables a program is like a calculator that forgets everything. When you add three items to a food-delivery cart, the app must **remember** the total, the coupon and the address. Variables do that remembering.

Types matter because the same operation behaves differently per type:
- \`5 + 5\` gives \`10\`
- \`"5" + "5"\` gives \`"55"\`
- \`"5" + 5\` raises a **TypeError**

The type tells you what you are allowed to do with a value. Text from a form like "21" must be converted with \`int("21")\` before you can do maths with it.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Har real Python app ki neev yahi hai:

- **Instagram** ka backend Django (Python framework) pe bana hai. Jab tumhara profile load hota hai, toh username (\`str\`), followers count (\`int\`), \`is_private\` (\`bool\`) jaise values Python variables mein hi aati-jaati hain.
- **Spotify** aur **Netflix** jaisi companies data analysis ke liye Python use karti hain. Wahan pandas library har column ka **dtype** (int64, float64, object) track karti hai — galat type ho toh poora analysis gadbad.
- Payment apps (UPI) mein amount ko aksar **paise mein \`int\`** rakha jaata hai (₹199.50 → \`19950\`), kyunki \`float\` mein chhota sa rounding error bhi paise ka hisaab bigaad deta hai.`,
          en: `Every real Python app is built on this:

- **Instagram**'s backend runs on Django, a Python framework. Profile values like the username (\`str\`), follower count (\`int\`) and \`is_private\` (\`bool\`) travel through Python variables.
- **Spotify** and **Netflix** use Python for data analysis. The pandas library tracks a **dtype** for every column (int64, float64, object), and the wrong type breaks the analysis.
- Payment systems often store money as an **\`int\` number of paise** (₹199.50 becomes \`19950\`) because \`float\` rounding errors are unacceptable for money.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Andar kya hota hai jab tum \`age = 21\` likhte ho?

1. Python pehle right side evaluate karta hai — memory mein ek **int object** banta hai jiski value 21 hai. Har object ke paas teen cheezein hoti hain: **type**, **value**, aur **id** (memory address jaisa).
2. Phir naam \`age\` ko us object se **bind** kar deta hai (ek namespace dictionary mein entry: \`"age" → object\`).
3. \`b = age\` likhoge toh naya object nahi banta — \`b\` bhi usi object ko point karta hai. \`id(age) == id(b)\` True aayega.
4. \`age = age + 1\` pe naya int object 22 banta hai aur \`age\` usse rebind hota hai. \`int\`, \`float\`, \`str\`, \`bool\` **immutable** hain — inko badla nahi ja sakta, sirf naya banaya ja sakta hai.

Jab kisi object ko koi naam point nahi karta, Python ka **reference counting** usse free kar deta hai.`,
          en: `What happens when you write \`age = 21\`?

1. Python evaluates the right side and creates an **int object** with value 21. Every object has a **type**, a **value** and an **id**.
2. It binds the name \`age\` to that object (an entry in a namespace dictionary).
3. \`b = age\` creates no new object; both names point to the same one, so \`id(age) == id(b)\`.
4. \`age = age + 1\` creates a new object 22 and rebinds \`age\`. \`int\`, \`float\`, \`str\` and \`bool\` are **immutable**: they are never changed in place.

When no name refers to an object any more, **reference counting** frees it.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Code ko line by line samjho:

- Pehle paanch variables, paanchon alag type ke. \`type(x).__name__\` se type ka naam print hota hai.
- \`age = age + 1\` — naya value bana, \`age\` ne naya object pakad liya.
- \`"5" + "5"\` text jodta hai, \`5 + 5\` number. Dono ka fark output mein dikhega.
- \`int("42") + 8\` — string ko pehle int mein convert kiya, phir jod diya.
- \`0.1 + 0.2\` exact \`0.3\` nahi aata — isliye money ke liye paise wala \`int\` use karo.

JavaScript version mein \`typeof\` same kaam karta hai. Dhyaan do: JS mein \`typeof null\` galti se \`"object"\` deta hai — ye JS ki purani quirk hai.`,
          en: `Line by line:

- Five variables of five different types; \`type(x).__name__\` prints the type name.
- \`age = age + 1\` creates a new value and rebinds \`age\`.
- \`"5" + "5"\` joins text while \`5 + 5\` adds numbers.
- \`int("42") + 8\` converts the string first, then adds.
- \`0.1 + 0.2\` is not exactly \`0.3\`, which is why money is stored as integer paise.

The JavaScript version uses \`typeof\`. Note the old quirk: \`typeof null\` is \`"object"\`.`,
        },
        codeJs: `const name = "Priya";
let age = 21;
const cgpa = 8.7;
const isPlaced = false;
const offer = null;

for (const value of [name, age, cgpa, isPlaced, offer]) {
  console.log(JSON.stringify(value), "->", typeof value);
}

age = age + 1;
console.log("Next year age:", age);

console.log("5" + "5", 5 + 5);
console.log(parseInt("42", 10) + 8);
console.log(0.1 + 0.2 === 0.3, Math.round((0.1 + 0.2) * 100) / 100);

const pricePaise = 19950; // Rs 199.50 stored safely as an integer
console.log("Rs", Math.floor(pricePaise / 100), "and", pricePaise % 100, "paise");`,
        codePython: `name = "Priya"
age = 21
cgpa = 8.7
is_placed = False
offer = None

for value in [name, age, cgpa, is_placed, offer]:
    print(repr(value), "->", type(value).__name__)

age = age + 1
print("Next year age:", age)

print("5" + "5", 5 + 5)
print(int("42") + 8)
print(0.1 + 0.2 == 0.3, round(0.1 + 0.2, 2))

price_paise = 19950  # Rs 199.50 stored safely as int
print("Rs", price_paise // 100, "and", price_paise % 100, "paise")`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Ye galtiyan har fresher karta hai — tum mat karna:

1. **\`input()\` ko number samajhna.** \`input()\` hamesha \`str\` deta hai. \`age = input()\` ke baad \`age + 1\` → TypeError. Pehle \`int(age)\` karo.
2. **\`=\` aur \`==\` mein confusion.** \`=\` value rakhta hai, \`==\` compare karta hai.
3. **Built-in naam overwrite karna.** \`list = [1, 2]\` ya \`str = "hi"\` likh diya, ab \`list()\` function kaam nahi karega. Aise naam mat rakho.
4. **Invalid naam.** \`2nd_year\`, \`student-name\`, \`class\` — ye sab invalid hain. Naam letter ya \`_\` se shuru ho, \`-\` nahi, keywords nahi.
5. **Float pe blind bharosa.** \`0.1 + 0.2 == 0.3\` → \`False\`. Paisa hai toh paise mein \`int\` rakho ya \`Decimal\` use karo.`,
          en: `Mistakes almost every beginner makes:

1. **Treating \`input()\` as a number.** It always returns \`str\`; convert with \`int()\` first.
2. **Mixing up \`=\` and \`==\`.** \`=\` assigns, \`==\` compares.
3. **Overwriting built-ins** like \`list = [1, 2]\` or \`str = "hi"\`, which breaks \`list()\` and \`str()\`.
4. **Invalid names** such as \`2nd_year\`, \`student-name\` or \`class\`.
5. **Trusting floats for money.** \`0.1 + 0.2 == 0.3\` is \`False\`; use integer paise or \`Decimal\`.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Type ki problem aaye toh ye checklist follow karo:

- **Error message poora padho.** \`TypeError: can only concatenate str (not "int") to str\` saaf bata raha hai ki ek side string hai, ek side int.
- **\`print(type(x), repr(x))\` lagao.** \`repr\` quotes bhi dikhata hai, toh \`'21'\` (string) aur \`21\` (int) ka fark turant dikhega.
- **\`NameError: name 'x' is not defined\`** — spelling check karo (\`Age\` vs \`age\`, Python case-sensitive hai) ya variable use karne se pehle define karo.
- VS Code mein **breakpoint** lagao aur Run and Debug chalao — left panel mein har variable ki value aur type live dikhegi.
- Shak ho ki do naam same object pe hain? \`a is b\` ya \`id(a) == id(b)\` check karo.`,
          en: `When a type problem appears:

- **Read the full error.** \`can only concatenate str (not "int") to str\` tells you exactly which side is which type.
- **Print \`type(x)\` and \`repr(x)\`.** \`repr\` shows quotes, so \`'21'\` and \`21\` look different.
- **\`NameError\`** means a typo (Python is case-sensitive) or using a name before assigning it.
- In VS Code, set a **breakpoint** and use Run and Debug to see every variable's value and type live.
- To check whether two names share one object, use \`a is b\`.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Dynamic typing ka fayda: code jaldi likhta hai, kam boilerplate. Nuksaan: type ki galti **run karte waqt** pakdi jaati hai, pehle nahi. Bade project mein ye costly hai.

Isliye real teams ye karti hain:
- **Type hints** likhti hain: \`def total(price: int, qty: int) -> int:\` — aur \`mypy\` ya \`pyright\` jaise tools run se pehle hi galti pakad lete hain.
- Money ke liye \`float\` nahi — **\`int\` paise** ya \`decimal.Decimal\`.
- Bahut saare related values hain (name, age, cgpa)? Alag-alag variables ki jagah **dict** ya **dataclass** use karo — aage ke topics mein seekhoge.

Chhote script mein bina hints chalega; team project mein hints lagbhag zaroori ho jaate hain.`,
          en: `Dynamic typing makes code quick to write, but type errors only show up **at runtime**, which gets expensive in large projects.

Real teams therefore:
- Add **type hints** like \`def total(price: int, qty: int) -> int:\` and run \`mypy\` or \`pyright\` to catch errors before running.
- Avoid \`float\` for money and use **integer paise** or \`decimal.Decimal\`.
- Group related values into a **dict** or **dataclass** instead of many loose variables.

Small scripts can skip hints; team projects usually should not.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Maan lo tum ek chhota food-ordering backend bana rahe ho. Ek order aaya:

\`\`\`python
order_id = "ORD-1042"      # str: ID mein letters bhi hain
amount_paise = 34900       # int: Rs 349.00, float nahi
is_veg = True              # bool: filter ke liye
coupon_code = None         # None: coupon nahi lagaya
\`\`\`

Yahan har type ek soch-samajh ke liye gaya decision hai. \`order_id\` string hai kyunki us pe maths nahi karna. Amount int paise mein hai taaki GST aur discount ke baad bhi ek paisa idhar-udhar na ho. \`coupon_code = None\` matlab "coupon nahi hai" — empty string \`""\` se zyada clear hai.

Interview mein jab tum project explain karoge, ye bolna ki "money ko integer paise mein store kiya" — interviewer ko turant pata chal jaata hai ki tum real-world soch rakhte ho.`,
          en: `Imagine a small food-ordering backend receiving an order:

\`\`\`python
order_id = "ORD-1042"      # str: contains letters
amount_paise = 34900       # int: Rs 349.00, not a float
is_veg = True              # bool: used by filters
coupon_code = None         # None: no coupon applied
\`\`\`

Each type is a deliberate choice. The ID is a string because you never do maths on it. The amount is integer paise so GST and discounts never lose a paisa. \`None\` says "no coupon" more clearly than an empty string. Mentioning this in an interview shows real-world thinking.`,
        },
      },
    ],
    visualization: {
      kind: "CODE_EXECUTION",
      title: "Names are labels, objects hold the values",
      steps: [
        {
          title: "age = 21",
          description: "Python creates an int object 21 in memory and sticks the label `age` on it.",
          highlight: "age → 21",
        },
        {
          title: "b = age",
          description: "No new object. The label `b` is stuck on the SAME object 21. `age is b` is True.",
          highlight: "age, b → 21",
        },
        {
          title: "age = age + 1",
          description: "Python computes 22, creates a NEW int object and moves the label `age` to it. Ints are immutable, so 21 is untouched.",
          highlight: "age → 22, b → 21",
        },
        {
          title: "name = \"Priya\"",
          description: "A str object is created. Each object knows its own type; the name does not.",
          highlight: "name → 'Priya' (str)",
        },
        {
          title: "print(type(age), b)",
          description: "Python looks up each label and prints `<class 'int'> 21`. Objects with no labels left are freed by reference counting.",
          highlight: "output: <class 'int'> 21",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the type of `3.0` in Python?",
        options: ["int", "float", "str", "bool"],
        correct: [1],
        explanation: "Decimal point laga hai toh `float` hai, bhale hi value 3 ke barabar ho. `int` sirf bina decimal wale numbers hote hain.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which of these is a valid Python variable name?",
        options: ["2nd_year", "student-name", "student_name", "class"],
        correct: [2],
        explanation: "Naam letter ya underscore se shuru hona chahiye, `-` allowed nahi, aur `class` keyword hai. Sirf `student_name` sahi hai.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `input()` return when the user types 25?",
        options: ["The int 25", "The str '25'", "The float 25.0", "It depends on what the user types"],
        correct: [1],
        explanation: "`input()` hamesha string deta hai — `'25'`. Number chahiye toh `int(input())` likho.",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these values are falsy in Python (behave like False in an if)?",
        options: ["0", "\"\"", "None", "\"0\"", "[]"],
        correct: [0, 1, 2, 4],
        explanation: "`0`, `\"\"` (empty string), `None` aur `[]` (empty list) falsy hain. `\"0\"` ek non-empty string hai — usme ek character hai — isliye truthy hai.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 1,
        prompt: "What does this code print?",
        code: `a = 10
b = a
a = a + 5
print(a, b)`,
        codeLanguage: "python",
        options: ["15 15", "15 10", "10 10", "10 15"],
        correct: [1],
        explanation: "`b = a` ne `b` ko object 10 pe point kiya. Phir `a = a + 5` ne naya object 15 banaya aur sirf `a` ko move kiya. `b` abhi bhi 10 pe hai.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: "print(\"5\" * 3, 5 * 3)",
        codeLanguage: "python",
        options: ["15 15", "555 15", "'555' 15", "TypeError"],
        correct: [1],
        explanation: "String ko number se multiply karo toh string repeat hoti hai: `\"5\" * 3` → `555`. Int ke saath normal multiplication: `5 * 3` → `15`. `print` string ko quotes ke bina dikhata hai.",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "You are building a wallet feature. Amounts like Rs 0.10 and Rs 0.20 are added and sometimes the total shows 0.30000000000000004. What is the best fix?",
        options: [
          "Round the total to 2 decimals before displaying",
          "Store all amounts as integer paise (or use Decimal)",
          "Use str for amounts",
          "Use bool to mark rounded values",
        ],
        correct: [1],
        explanation: "Float binary mein 0.1 exactly store nahi kar sakta. Money ko integer paise mein rakho (ya `Decimal` use karo) — tab addition hamesha exact hoga. Sirf display pe round karna bug ko chhupata hai, hatata nahi.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Put in order what Python does for `x = 5 + 3` followed by `print(x)`.",
        options: [
          "Evaluate the right side 5 + 3",
          "Create an int object with value 8",
          "Bind the name x to that object",
          "On print(x), look up x and print 8",
        ],
        explanation: "Pehle right side evaluate hoti hai, uska object banta hai, phir naam bind hota hai. `print` ke time naam lookup hota hai.",
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Explain dynamic typing in Python and one risk it brings.",
        keywords: ["runtime", "no declaration", "typeerror", "type hints"],
        explanation: "Accha answer: Python mein type variable ke naam ka nahi, value/object ka hota hai, aur check runtime pe hota hai — declare nahi karna padta. Risk: galat type ki galti (TypeError) program chalne pe hi pakdi jaati hai; type hints + mypy se bacha ja sakta hai.",
      },
    ],
    interview: [
      {
        question: "What is dynamic typing in Python?",
        short: "In Python, types belong to objects, not to variable names. A name can point to an int now and a string later, and type checks happen at runtime. It speeds up development but type errors surface only when the code runs, so teams add type hints and a checker like mypy.",
        deep: `- **Names vs objects:** a variable is just a name bound to an object; the object carries its type (\`type(obj)\`).
- **Dynamic:** you can rebind \`x = 1\` then \`x = "one"\`; no declaration needed.
- **Strong:** Python still refuses implicit nonsense like \`"5" + 5\` (TypeError), unlike JavaScript which coerces to \`"55"\`.
- **Mitigation:** type hints (\`def f(x: int) -> str\`), static checkers (mypy, pyright), and tests.`,
        followUps: [
          "Is Python strongly or weakly typed?",
          "How do type hints affect runtime behaviour?",
          "What does `x is y` check compared to `x == y`?",
        ],
        commonMistake: "Saying Python is 'weakly typed' because types are not declared. Dynamic and weak are different things.",
        keywords: ["names bound to objects", "runtime type checks", "strongly typed", "type hints", "mypy"],
        difficulty: 1,
        roles: ["SDE", "BACKEND", "AI"],
      },
      {
        question: "What is the difference between mutable and immutable types in Python?",
        short: "Immutable objects like int, float, str, bool and tuple cannot be changed after creation; any 'change' creates a new object. Mutable objects like list, dict and set can be modified in place, so every name pointing to them sees the change.",
        deep: `\`\`\`python
a = "hi";  b = a;  a += "!"     # new str object, b is still "hi"
x = [1];   y = x;  x.append(2) # same list, y is now [1, 2]
\`\`\`
Consequences:
- Only immutable (hashable) objects can be dict keys or set members.
- Mutable default arguments are shared between calls, a classic bug.
- Passing a list to a function lets the function modify the caller's list.`,
        followUps: [
          "Why can a tuple containing a list not be used as a dict key?",
          "How do you copy a list safely?",
          "What is the mutable default argument bug?",
        ],
        commonMistake: "Thinking `a += 1` modifies the integer in place. It rebinds `a` to a new object.",
        keywords: ["immutable", "mutable", "new object", "in place", "hashable"],
        difficulty: 2,
        roles: ["SDE", "BACKEND"],
      },
    ],
  },
  {
    slug: "py-conditions",
    estMinutes: 35,
    difficulty: 1,
    prerequisites: ["py-variables-types", "py-operators"],
    objectives: [
      "Write if / elif / else chains with correct indentation",
      "Predict which branch runs, knowing elif stops at the first True condition",
      "Use comparison, logical operators and truthiness correctly, including short-circuiting",
      "Replace deep nesting with guard clauses and readable conditions",
    ],
    technicalDefinition: "Conditional statements (if / elif / else) evaluate boolean expressions in order and execute the first block whose condition is truthy, enabling a program to branch on runtime data.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Condition** matlab program ko decision lene dena: "agar ye sach hai toh ye karo, warna wo karo."

\`\`\`python
if marks >= 40:
    print("Pass")
else:
    print("Fail")
\`\`\`

- \`if\` ke baad ek condition aati hai jo \`True\` ya \`False\` banti hai.
- \`elif\` (else-if) — pehli condition fail hui toh agli check karo.
- \`else\` — koi bhi condition sach nahi hui toh ye chalega.

Python mein block **indentation** (4 spaces) se banta hai, curly braces se nahi. Aur colon \`:\` lagana mat bhoolna.`,
          en: `A **condition** lets a program make a decision: "if this is true do this, otherwise do that."

- \`if\` is followed by an expression that becomes \`True\` or \`False\`.
- \`elif\` (else-if) checks the next condition when the earlier ones failed.
- \`else\` runs when no condition was true.

Python marks blocks with **indentation** (4 spaces), not curly braces, and every condition line ends with a colon \`:\`.`,
          hi: `**कंडीशन** का मतलब है प्रोग्राम को फ़ैसला लेने देना: "अगर यह सच है तो यह करो, नहीं तो वह करो।"

- \`if\` के बाद एक शर्त आती है जो \`True\` या \`False\` बनती है।
- \`elif\` — पहली शर्त गलत निकली तो अगली शर्त जाँचो।
- \`else\` — कोई भी शर्त सच नहीं हुई तो यह चलेगा।

Python में ब्लॉक **इंडेंटेशन** (4 स्पेस) से बनता है, कर्ली ब्रैकेट से नहीं। और हर शर्त के बाद कोलन \`:\` लगाना ज़रूरी है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Subah college jaate waqt mummy ka rule yaad karo:

- "**Agar** baarish ho rahi hai → chhata le jao."
- "**Warna agar** tez dhoop hai → cap le jao."
- "**Warna** → kuch mat le jao, bas time pe jao."

Mummy upar se neeche check karti hain aur **pehla sahi jawab milte hi ruk jaati hain**. Agar baarish bhi ho rahi hai aur dhoop bhi (rainbow day!), tab bhi tumhe sirf chhata milega — kyunki pehli condition hi sach ho gayi.

Bilkul yahi \`if / elif / else\` karta hai. Isliye **order matter karta hai**: sabse specific ya sabse important condition upar rakho.`,
          en: `Think of a parent's morning rule:

- "**If** it is raining, take an umbrella."
- "**Else if** it is very sunny, take a cap."
- "**Else**, take nothing."

They check from top to bottom and **stop at the first true answer**. Even if it is both rainy and sunny, you only get the umbrella. That is exactly how \`if / elif / else\` works, which is why the **order of conditions matters**.`,
          hi: `सुबह कॉलेज जाते समय माँ का नियम याद कीजिए:

- "**अगर** बारिश हो रही है → छाता ले जाओ।"
- "**नहीं तो अगर** तेज़ धूप है → टोपी ले जाओ।"
- "**नहीं तो** → कुछ मत ले जाओ।"

माँ ऊपर से नीचे जाँचती हैं और **पहला सही जवाब मिलते ही रुक जाती हैं**। बारिश और धूप दोनों हों, तब भी सिर्फ़ छाता मिलेगा। \`if / elif / else\` बिल्कुल ऐसे ही काम करता है — इसलिए शर्तों का **क्रम** बहुत मायने रखता है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Bina conditions ke program har baar **same kaam** karega, chahe situation kuch bhi ho. Socho ATM jo balance check kiye bina paise de de — bank band ho jaayega!

Real duniya ka har software decisions se bhara hai:
- Password sahi hai? → login karo, warna error dikhao.
- Cart value minimum se zyada hai? → free delivery, warna delivery fee.
- User ki age 18+ hai? → signup allow, warna block.

Conditions hi program ko **smart** banati hain — data dekh ke alag-alag raasta chunne ki taakat deti hain. Loops, functions, DSA — sab mein tum conditions har jagah likhoge, isliye inko pakka karna zaroori hai.`,
          en: `Without conditions a program does **the same thing every time**, no matter the situation. Imagine an ATM that pays out without checking your balance.

Real software is full of decisions:
- Correct password? Log in, otherwise show an error.
- Cart above the minimum? Free delivery, otherwise add a fee.
- Age 18 or above? Allow signup, otherwise block.

Conditions let a program choose a path based on data. You will write them inside loops, functions and every DSA problem.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Tum roz conditions ka result dekhte ho, bas code nahi dikhta:

- **Swiggy / Zomato** — "Free delivery above ₹X" ya "Restaurant closed" jaise messages business rules se aate hain: agar cart value threshold se kam hai toh fee jodo, agar restaurant ka time khatam toh order block karo.
- **UPI apps (PhonePe, Google Pay, Paytm)** — NPCI ki daily transaction limit hoti hai. Payment se pehle checks chalte hain: PIN sahi? balance kaafi? limit cross toh nahi hui?
- **IRCTC Tatkal** — Tatkal booking AC class ke liye 10 AM aur non-AC ke liye 11 AM se khulti hai. System time aur class dekh ke decide karta hai ki booking allow hai ya nahi.`,
          en: `You see the results of conditions every day:

- **Swiggy / Zomato** show messages like "Free delivery above ₹X" or "Restaurant closed", which come from rules such as "if the cart is below the threshold, add a fee".
- **UPI apps** check before paying: is the PIN correct, is the balance enough, is the daily limit set by NPCI exceeded?
- **IRCTC Tatkal** opens at 10 AM for AC classes and 11 AM for non-AC classes, so the system checks the time and class before allowing a booking.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Python \`if\` ko kaise chalata hai:

1. Condition expression evaluate hota hai — jaise \`marks >= 90\` → \`False\`.
2. Result pe **truthiness** check hoti hai. Sirf \`True/False\` nahi — \`0\`, \`""\`, \`None\`, \`[]\`, \`{}\` falsy hain; baaki sab truthy.
3. Truthy mila → wo block chalao aur **baaki poori chain skip** karo. Falsy → agle \`elif\` pe jao.
4. Koi match nahi → \`else\` (agar hai).

**Short-circuit:** \`a and b\` mein agar \`a\` falsy hai toh \`b\` evaluate hi nahi hota. \`a or b\` mein \`a\` truthy hai toh \`b\` skip. Isliye \`if x != 0 and 10 / x > 2:\` kabhi ZeroDivisionError nahi dega.

Ek line wala version bhi hai: \`status = "Pass" if marks >= 40 else "Fail"\` (ternary expression).`,
          en: `How Python runs an \`if\`:

1. The condition is evaluated, for example \`marks >= 90\` gives \`False\`.
2. Python checks its **truthiness**: \`0\`, \`""\`, \`None\`, \`[]\` and \`{}\` are falsy; everything else is truthy.
3. On truthy it runs that block and **skips the rest of the chain**; otherwise it moves to the next \`elif\`.
4. If nothing matched, \`else\` runs.

**Short-circuiting:** in \`a and b\`, \`b\` is skipped when \`a\` is falsy; in \`a or b\`, \`b\` is skipped when \`a\` is truthy. The one-line form is \`x if cond else y\`.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Is code mein teen cheezein dekho:

- \`grade()\` function — upar se neeche check: 90+, 75+, 60+, 40+. Pehle invalid marks (0 se kam ya 100 se zyada) ko **guard clause** se nikal diya.
- \`for\` loop sirf testing ke liye — alag-alag marks pe grade print karta hai, boundary values (90, 40, 39) bhi.
- Last mein **short-circuit** ka demo: \`stock > 0 and price / stock\` — jab stock 0 hai toh division chalta hi nahi, isliye crash nahi hota.

JS version mein \`if / else if / else\` aur \`&&\` same kaam karte hain. Fark sirf syntax ka hai: JS mein curly braces aur \`===\` (strict equality).`,
          en: `Three things to notice:

- \`grade()\` checks top to bottom: 90+, 75+, 60+, 40+. Invalid marks are rejected first with a **guard clause**.
- The loop tests several marks, including boundary values like 90, 40 and 39.
- The last line shows **short-circuiting**: when stock is 0 the division never runs, so nothing crashes.

JavaScript uses \`if / else if / else\`, curly braces and \`&&\` for the same logic.`,
        },
        codeJs: `function grade(marks) {
  if (marks < 0 || marks > 100) return "Invalid";
  if (marks >= 90) {
    return "A";
  } else if (marks >= 75) {
    return "B";
  } else if (marks >= 60) {
    return "C";
  } else if (marks >= 40) {
    return "D";
  } else {
    return "F";
  }
}

for (const m of [95, 90, 82, 61, 40, 39, 105]) {
  console.log(m, "->", grade(m));
}

const status = grade(55) !== "F" ? "Pass" : "Fail";
console.log("55 is", status);

const stock = 0;
const price = 500;
if (stock > 0 && price / stock < 100) {
  console.log("cheap per unit");
} else {
  console.log("out of stock, division skipped");
}`,
        codePython: `def grade(marks):
    if marks < 0 or marks > 100:
        return "Invalid"
    if marks >= 90:
        return "A"
    elif marks >= 75:
        return "B"
    elif marks >= 60:
        return "C"
    elif marks >= 40:
        return "D"
    else:
        return "F"

for m in [95, 90, 82, 61, 40, 39, 105]:
    print(m, "->", grade(m))

status = "Pass" if grade(55) != "F" else "Fail"
print("55 is", status)

stock = 0
price = 500
if stock > 0 and price / stock < 100:
    print("cheap per unit")
else:
    print("out of stock, division skipped")`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **Galat order.** \`if marks >= 40\` ko \`if marks >= 90\` se pehle rakh diya → 95 marks wale ko bhi "D" milega. Specific condition upar.
2. **\`=\` vs \`==\`.** \`if x = 5:\` SyntaxError deta hai. Compare ke liye \`==\`.
3. **\`if x == 1 or 2:\`** — ye hamesha True hai! Python isse \`(x == 1) or 2\` padhta hai, aur \`2\` truthy hai. Sahi: \`if x == 1 or x == 2:\` ya \`if x in (1, 2):\`.
4. **Indentation gadbad.** Ek line 4 space, dusri 2 space → \`IndentationError\` ya galat block mein code.
5. **String vs int compare.** \`input()\` se aaya \`"18"\` aur \`18\` equal nahi hain. Pehle convert karo.
6. **Colon bhoolna** — \`if marks > 40\` ke baad \`:\` zaroori hai.`,
          en: `1. **Wrong order**: putting \`marks >= 40\` before \`marks >= 90\` gives 95 marks a "D". Put specific conditions first.
2. **\`=\` instead of \`==\`** is a SyntaxError inside \`if\`.
3. **\`if x == 1 or 2:\`** is always true, because it means \`(x == 1) or 2\`. Use \`x in (1, 2)\`.
4. **Inconsistent indentation** causes \`IndentationError\` or code in the wrong block.
5. **Comparing \`"18"\` with \`18\`** is always unequal; convert input first.
6. **Forgetting the colon** after the condition.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Galat branch chal rahi hai? Aise pakdo:

- **Condition ko print karo:** \`print(marks, marks >= 75)\` — dikh jaayega ki condition actually \`True\` ban rahi hai ya \`False\`.
- **Boundary values se test karo.** Bugs edges pe chhupte hain: 39, 40, 74, 75, 89, 90, 100, -1. Har edge pe expected answer pehle socho, phir run karo.
- **\`assert\` likho:** \`assert grade(90) == "A"\` — galat hua toh turant AssertionError.
- **Types check karo:** \`print(type(age))\`. \`"18" >= 18\` Python 3 mein TypeError deta hai.
- VS Code debugger mein \`if\` line pe breakpoint lagao aur **Step Over** dabao — dikhega kaunsi branch chuni gayi.`,
          en: `When the wrong branch runs:

- **Print the condition** itself: \`print(marks, marks >= 75)\`.
- **Test boundary values** such as 39, 40, 74, 75, 90, 100 and -1; bugs hide at the edges.
- **Use \`assert\`**, e.g. \`assert grade(90) == "A"\`.
- **Check types**: comparing \`"18" >= 18\` raises a TypeError in Python 3.
- Put a breakpoint on the \`if\` line and **Step Over** to see which branch is chosen.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `\`if/elif\` simple hai, par har jagah best nahi:

- **Lambi chain** (15 \`elif\`, jaise city → delivery fee)? **Dictionary lookup** use karo: \`fee = FEES.get(city, 50)\`. Data change karna aasaan, code chhota.
- **Deep nesting** (if ke andar if ke andar if)? **Guard clauses** use karo — invalid case pe turant \`return\`, baaki code flat rahe.
- **Python 3.10+** mein \`match\` statement hai — structured data (jaise command type) pe pattern matching ke liye clean hai.
- Ternary (\`a if c else b\`) chhote cases ke liye theek hai; nested ternary padhna mushkil — mat likho.

Rule of thumb: agar condition samjhane mein 10 second se zyada lage, usse naam do: \`is_eligible = age >= 18 and has_id\`.`,
          en: `\`if/elif\` is simple but not always the best tool:

- A **long chain** mapping values (like city to delivery fee) is cleaner as a **dictionary lookup**: \`FEES.get(city, 50)\`.
- **Deep nesting** is better replaced with **guard clauses** that return early.
- Python 3.10+ has \`match\` for pattern matching on structured data.
- Avoid nested ternaries; they are hard to read.

If a condition is hard to read, give it a name: \`is_eligible = age >= 18 and has_id\`.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek e-commerce checkout API mein conditions kuch aise dikhti hain:

\`\`\`python
def checkout(user, cart):
    if user is None:
        return "LOGIN_REQUIRED"
    if not cart:
        return "CART_EMPTY"
    if cart_total(cart) > user.wallet_paise:
        return "INSUFFICIENT_BALANCE"
    return "OK"
\`\`\`

Dekho — koi nesting nahi. Har galat case pe **turant return** (guard clause). Sabse aakhir mein happy path. Ye style production code mein bahut common hai kyunki padhne mein seedha hai aur har failure ka apna clear status code hai, jo frontend user ko sahi message dikhane mein use karta hai.

Tip: \`if user is None\` likho, \`if user == None\` nahi — \`is\` identity check hai aur \`None\` ke liye recommended hai.`,
          en: `A checkout API often looks like this:

\`\`\`python
def checkout(user, cart):
    if user is None:
        return "LOGIN_REQUIRED"
    if not cart:
        return "CART_EMPTY"
    if cart_total(cart) > user.wallet_paise:
        return "INSUFFICIENT_BALANCE"
    return "OK"
\`\`\`

No nesting: every failure case returns early (guard clauses) and the happy path is last. Each failure has a clear status the frontend can turn into a message. Use \`is None\`, not \`== None\`.`,
        },
      },
    ],
    visualization: {
      kind: "FLOW",
      title: "How grade(82) walks the if / elif chain",
      steps: [
        {
          title: "Guard clause",
          description: "Is 82 < 0 or > 100? No, so we continue.",
          highlight: "marks = 82",
        },
        {
          title: "if marks >= 90",
          description: "82 >= 90 is False. Move to the next elif.",
          highlight: "False",
        },
        {
          title: "elif marks >= 75",
          description: "82 >= 75 is True. This block runs and returns \"B\".",
          highlight: "True → \"B\"",
        },
        {
          title: "Rest is skipped",
          description: "elif >= 60, elif >= 40 and else are never checked. The first True wins.",
          highlight: "skipped",
        },
        {
          title: "Result",
          description: "The function returns \"B\". Changing the order of conditions would change this answer.",
          highlight: "grade(82) = \"B\"",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which keyword checks another condition only when the previous `if` was False?",
        options: ["else if", "elif", "elseif", "then"],
        correct: [1],
        explanation: "`elif` matlab 'else if' — pehli condition fail hui toh hi ye check hota hai. Python mein `else if` ya `elseif` nahi hota.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "If `x = 15`, which condition is True?",
        options: ["x > 20", "x > 10 and x < 20", "x == '15'", "not x"],
        correct: [1],
        explanation: "`x > 10 and x < 20` → 15 dono shart poori karta hai. Python mein `10 < x < 20` bhi likh sakte ho (chained comparison).",
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "What is wrong with `if city == \"Delhi\" or \"Mumbai\":`?",
        options: [
          "Nothing, it works",
          "It is always True because \"Mumbai\" is truthy",
          "It raises a SyntaxError",
          "It is always False",
        ],
        correct: [1],
        explanation: "Python isse `(city == \"Delhi\") or \"Mumbai\"` padhta hai. Non-empty string `\"Mumbai\"` truthy hai, isliye condition hamesha True. Sahi: `city in (\"Delhi\", \"Mumbai\")`.",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these values are truthy in Python?",
        options: ["\"0\"", "[0]", "0.0", "\" \"", "None"],
        correct: [0, 1, 3],
        explanation: "`\"0\"` aur `\" \"` non-empty strings hain, `[0]` non-empty list hai — teeno truthy. `0.0` aur `None` falsy hain.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 1,
        prompt: "What does this code print?",
        code: `marks = 75
if marks >= 40:
    print("Pass")
elif marks >= 75:
    print("Distinction")
else:
    print("Fail")`,
        codeLanguage: "python",
        options: ["Pass", "Distinction", "Pass and Distinction", "Fail"],
        correct: [0],
        explanation: "75 >= 40 already True ho gaya, isliye pehla block chala aur chain wahin ruk gayi. `>= 75` wali branch kabhi check hi nahi hui — ye galat order ka classic bug hai.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `x = 0
y = 5
if x and y / x > 1:
    print("big")
else:
    print("safe")`,
        codeLanguage: "python",
        options: ["big", "safe", "ZeroDivisionError", "Nothing is printed"],
        correct: [1],
        explanation: "`x` 0 hai, jo falsy hai. `and` short-circuit karta hai, toh `y / x` chalta hi nahi — ZeroDivisionError nahi aata, seedha `else` chalta hai.",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "A UPI payment must fail with a specific reason. Checks: wrong PIN, insufficient balance, daily limit exceeded. A user with a wrong PIN and low balance should see 'Wrong PIN'. Which structure is right?",
        options: [
          "if/elif chain with PIN check first, then balance, then limit",
          "Three separate ifs without return, each printing its own message",
          "Check balance first because it is cheaper",
          "A single if with all checks joined by `or` and one generic message",
        ],
        correct: [0],
        explanation: "Guard clauses top-to-bottom, sabse pehle PIN. Pehla failing check message decide karta hai. Alag-alag independent `if` (bina return) se multiple messages aa jayenge.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order how Python executes an if / elif / else chain.",
        options: [
          "Evaluate the if condition",
          "If truthy, run its block and skip the rest of the chain",
          "Otherwise evaluate each elif condition in order",
          "If none was truthy, run the else block",
        ],
        explanation: "Condition evaluate → truthiness → match pe block chalao aur baaki skip; nahi toh next elif; kuch nahi mila toh else.",
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Why does the order of conditions in an if / elif chain matter? Give an example.",
        keywords: ["top to bottom", "first true", "skips the rest", "specific first"],
        explanation: "Chain upar se neeche check hoti hai aur pehli True condition pe ruk jaati hai — baaki skip. Isliye broad condition (marks >= 40) agar specific (marks >= 90) se pehle hai, toh 95 ko bhi galat grade milega.",
      },
    ],
    buildTask: {
      title: "Grade calculator",
      description: `College ka result system bana rahe ho. Function \`grade(marks)\` likho jo ek integer \`marks\` (0–100) le aur grade return kare:

- 90 ya zyada → \`"A"\`
- 75 se 89 → \`"B"\`
- 60 se 74 → \`"C"\`
- 40 se 59 → \`"D"\`
- 40 se kam → \`"F"\`
- 0 se kam ya 100 se zyada → \`"Invalid"\`

Return karna hai, print nahi. Boundary values (90, 75, 60, 40) pe dhyaan do!`,
      functionName: "grade",
      starterJs: `function grade(marks) {
  // TODO: return "A", "B", "C", "D", "F" or "Invalid"
}`,
      starterPython: `def grade(marks):
    # TODO: return "A", "B", "C", "D", "F" or "Invalid"
    pass`,
      tests: [
        {
          name: "95 is an A",
          args: [95],
          expected: "A",
        },
        {
          name: "82 is a B",
          args: [82],
          expected: "B",
        },
        {
          name: "60 is exactly a C",
          args: [60],
          expected: "C",
        },
        {
          name: "40 is exactly a D",
          args: [40],
          expected: "D",
        },
        {
          name: "12 fails",
          args: [12],
          expected: "F",
        },
        {
          name: "90 boundary is an A",
          args: [90],
          expected: "A",
          hidden: true,
        },
        {
          name: "105 is invalid",
          args: [105],
          expected: "Invalid",
          hidden: true,
        },
      ],
      hints: [
        "if / elif chain upar se neeche check hoti hai aur pehli True condition pe ruk jaati hai. Isliye sabse bada cutoff (90) sabse upar rakho.",
        "Step 1: invalid marks (< 0 ya > 100) ko guard clause se pehle hi return karo. Step 2: phir >= 90, >= 75, >= 60, >= 40 order mein check karo. Step 3: bacha hua sab \"F\".",
        `if marks < 0 or marks > 100:
    return "Invalid"
if marks >= 90:
    return "A"
elif marks >= 75:
    ...`,
      ],
      explainQuestions: [
        {
          question: "Why must the >= 90 check come before the >= 75 check?",
          keywords: ["first true", "order", "stops", "90 also >= 75"],
        },
        {
          question: "What is a guard clause and where did you use one?",
          keywords: ["early return", "invalid", "before", "flat"],
        },
        {
          question: "Which test values did you think about to catch boundary bugs?",
          keywords: ["boundary", "90", "40", "edge"],
        },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "What is the difference between using if-elif-else and writing several separate if statements?",
        short: "In an if-elif-else chain only the first true branch runs and the rest are skipped. With separate if statements every condition is checked independently, so several blocks can run. Use a chain for mutually exclusive cases and separate ifs for independent checks.",
        deep: `\`\`\`python
x = 95
if x >= 90: print("A")
elif x >= 40: print("Pass")   # skipped

if x >= 90: print("A")
if x >= 40: print("Pass")     # also runs
\`\`\`
- A chain also saves work: later conditions are not evaluated once one matches.
- Separate ifs with early \`return\` (guard clauses) behave like a chain and keep code flat.`,
        followUps: [
          "When would you prefer a dict lookup over a long elif chain?",
          "What is a guard clause?",
          "How does Python's match statement differ from a switch in C?",
        ],
        commonMistake: "Assuming separate ifs are equivalent to elif; they are not when conditions overlap.",
        keywords: ["first true branch", "mutually exclusive", "independent checks", "guard clause"],
        difficulty: 1,
        roles: ["SDE", "BACKEND"],
      },
      {
        question: "What is short-circuit evaluation?",
        short: "With `and`, if the left side is falsy the right side is never evaluated; with `or`, if the left side is truthy the right side is skipped. It is used to avoid errors, like checking `x != 0 and 10 / x > 2`, and to give defaults like `name = user_input or 'Guest'`.",
        deep: `- \`and\` returns the first falsy operand or the last operand; \`or\` returns the first truthy operand or the last one. They return operands, not just True/False.
- Common uses: guarding against \`None\` (\`if user and user.is_active\`), safe division, and default values.
- Watch out: \`count or 10\` replaces a legitimate \`0\` with 10.`,
        followUps: [
          "What does `0 or 'default'` return?",
          "What does `[] and 5` return?",
          "How is this different from the bitwise `&` operator?",
        ],
        commonMistake: "Thinking `and`/`or` always return a bool. They return one of the operands.",
        keywords: ["and", "or", "skips right side", "falsy", "truthy"],
        difficulty: 2,
        roles: ["SDE", "BACKEND", "FRONTEND"],
      },
    ],
  },
  {
    slug: "py-loops",
    estMinutes: 40,
    difficulty: 1,
    prerequisites: ["py-conditions"],
    objectives: [
      "Use for loops with range(), lists, strings and enumerate()",
      "Use while loops with a clear exit condition and avoid infinite loops",
      "Control loops with break and continue",
      "Explain how a for loop uses the iterator protocol under the hood",
    ],
    technicalDefinition: "A loop repeatedly executes a block: a `for` loop iterates over the items of an iterable via the iterator protocol, while a `while` loop repeats as long as its condition remains truthy.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Loop** matlab ek kaam ko baar-baar karna, bina code copy-paste kiye.

Python mein do loops hain:
- **\`for\` loop** — jab pata hai ki kis cheez pe ghoomna hai: list ke har item pe, string ke har character pe, ya \`range(1, 6)\` ke har number pe.
- **\`while\` loop** — jab tak koi condition sach hai, tab tak chalte raho. Kitni baar chalega pehle se pata nahi.

Do special keywords:
- \`break\` — loop yahin khatam, bahar niklo.
- \`continue\` — is round ka baaki kaam skip, agle round pe jao.`,
          en: `A **loop** repeats a piece of work without copy-pasting code.

Python has two loops:
- A **\`for\` loop** goes over a known sequence: every item of a list, every character of a string, or every number in \`range(1, 6)\`.
- A **\`while\` loop** repeats as long as a condition is true, when you do not know the count in advance.

Two keywords control loops: \`break\` exits the loop immediately, and \`continue\` skips the rest of the current round and moves to the next one.`,
          hi: `**लूप** का मतलब है एक काम को बार-बार करना, बिना कोड दोहराए।

Python में दो लूप हैं:
- **\`for\` लूप** — जब पता है किस चीज़ पर घूमना है: लिस्ट का हर आइटम, स्ट्रिंग का हर अक्षर, या \`range(1, 6)\` का हर नंबर।
- **\`while\` लूप** — जब तक कोई शर्त सच है, तब तक चलते रहो।

दो खास शब्द:
- \`break\` — लूप यहीं खत्म, बाहर निकलो।
- \`continue\` — इस बार का बाकी काम छोड़ो, अगले राउंड पर जाओ।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Mumbai local train socho, Churchgate se Virar:

- **\`for\` loop** = slow local. Stations ki list fixed hai — Churchgate, Marine Lines, Charni Road... train har station pe rukti hai, ek-ek karke. Tumhe pata hai kitne stations hain.
- **\`while\` loop** = "jab tak seat nahi milti, khade raho." Kitne stations lagenge, pata nahi — bas condition (seat mili?) har station pe check hoti hai.
- **\`continue\`** = fast train — kuch stations skip kar deti hai, par aage chalti rehti hai.
- **\`break\`** = tumhara station aa gaya, beech mein utar gaye. Train ki baaki journey tumhare liye khatam.

Aur **infinite loop**? Wo hai jab tum sone ki wajah se apna station miss karte raho aur train ghoomti rahe — kabhi utroge hi nahi!`,
          en: `Think of a Mumbai local train from Churchgate to Virar:

- A **\`for\` loop** is the slow local: a fixed list of stations, stopping at each one in turn.
- A **\`while\` loop** is "keep standing until you get a seat": you do not know how many stations it will take; you check the condition at every stop.
- **\`continue\`** is the fast train skipping some stations but continuing the journey.
- **\`break\`** is getting off at your station; the rest of the ride is over for you.

An **infinite loop** is falling asleep and never getting off.`,
          hi: `मुंबई की लोकल ट्रेन सोचिए, चर्चगेट से विरार तक:

- **\`for\` लूप** = स्लो लोकल। स्टेशनों की लिस्ट तय है और ट्रेन हर स्टेशन पर एक-एक करके रुकती है।
- **\`while\` लूप** = "जब तक सीट नहीं मिलती, खड़े रहो।" कितने स्टेशन लगेंगे पता नहीं, बस हर स्टेशन पर शर्त जाँचते हो।
- **\`continue\`** = फ़ास्ट ट्रेन — कुछ स्टेशन छोड़ देती है पर आगे चलती रहती है।
- **\`break\`** = आपका स्टेशन आ गया, आप बीच में उतर गए।

और **इनफ़िनिट लूप**? जब आप सो जाएँ और अपना स्टेशन कभी न उतरें!`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Socho tumhe 1 se 100 tak numbers print karne hain. Bina loop ke — 100 \`print\` lines! Aur agar 1 lakh orders ka total nikalna ho? Impossible.

Loops ki wajah se:
- **Code chhota** — 100 lines ki jagah 2 lines.
- **Data ka size matter nahi karta** — 3 items ho ya 3 crore, wahi code chalega.
- **Repeat until success** — OTP galat hai toh dobara poocho, network fail hua toh retry karo.

Programming mein data hamesha collections mein aata hai — cart items, users, messages, log lines. In sab pe kaam karne ka ek hi tareeka hai: loop. DSA ka 80% bhi loops pe hi tika hai.`,
          en: `Printing 1 to 100 without a loop would take 100 \`print\` lines, and totalling 1 lakh orders would be impossible.

Loops give you:
- **Short code**: two lines instead of a hundred.
- **Size independence**: the same code works for 3 items or 3 crore.
- **Repeat until success**: ask for the OTP again, retry a failed network call.

Data almost always comes in collections, such as cart items, users and log lines, and loops are how you process them. Most DSA problems are built on loops.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Loops har app mein chupke se chal rahe hain:

- **Swiggy / Zomato bill** — cart ke har item pe loop: \`price × quantity\` jodo, phir taxes aur delivery fee. Bill ka har line item ek loop iteration hai.
- **Instagram / WhatsApp notifications** — ek post pe 500 log tag hue toh system har tagged user pe loop chala ke notification banata hai (bade systems ye kaam batches mein queue se karte hain).
- **Data analysis with pandas** — Netflix, Spotify jaisi companies Python mein data analyse karti hain. pandas andar fast C loops chalata hai, isliye tum \`for\` likhne ki jagah \`df["total"].sum()\` likhte ho — par concept wahi hai: har row pe ghoomna.`,
          en: `Loops run quietly inside every app:

- **A food-delivery bill** loops over cart items, adding \`price × quantity\`, then taxes and fees.
- **Notifications**: when 500 people are tagged, the system loops over them to create notifications, usually in batches through a queue.
- **Data analysis with pandas** at companies like Netflix and Spotify: pandas runs fast loops in C, so you write \`df["total"].sum()\` instead of a Python \`for\`, but the idea is the same.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `\`for item in cart:\` andar kya karta hai?

1. Python \`iter(cart)\` call karta hai — ek **iterator** object milta hai (ek bookmark jo yaad rakhta hai ki kahan tak pahunche).
2. Har round mein \`next(iterator)\` call hota hai → agla item \`item\` mein aata hai → body chalti hai.
3. Items khatam → iterator **\`StopIteration\`** raise karta hai → \`for\` usse chupchaap pakad ke loop khatam kar deta hai.

Isliye \`for\` list, string, dict, file, \`range\` — kisi bhi **iterable** pe chalta hai. \`range(1_000_000)\` memory mein 10 lakh numbers nahi banata; wo **lazy** hai, ek-ek number zaroorat pe deta hai.

\`while\` simple hai: har round se pehle condition check, False hui toh bahar. Bonus: loop ke saath \`else\` bhi likh sakte ho — wo tab chalta hai jab loop **bina \`break\`** ke poora khatam ho.`,
          en: `What \`for item in cart:\` does internally:

1. Python calls \`iter(cart)\` to get an **iterator**, a bookmark of the current position.
2. Each round calls \`next(iterator)\`, puts the result in \`item\` and runs the body.
3. When items run out, the iterator raises **\`StopIteration\`**, which \`for\` catches to end the loop.

That is why \`for\` works on any **iterable**: lists, strings, dicts, files and \`range\`. \`range\` is **lazy**: it produces numbers on demand. A \`while\` loop checks its condition before every round. A loop's \`else\` block runs only if the loop finished without \`break\`.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Code walkthrough:

- **Bill total:** \`for name, price, qty in cart\` — har tuple ko teen variables mein unpack kiya, \`total += price * qty\`.
- **\`enumerate(cart, start=1)\`** — item ke saath number bhi deta hai. \`range(len(...))\` se zyada clean.
- **\`while\` retry:** 3 attempts tak payment try. \`attempt += 1\` bhoole toh infinite loop! Success pe \`break\`.
- **\`continue\`:** odd numbers skip, sirf even jode.

Output deterministic hai — "payment" ka result attempt number se decide hota hai (3rd attempt success), random nahi.`,
          en: `Walkthrough:

- **Bill total**: each tuple is unpacked into three names and \`total += price * qty\`.
- **\`enumerate(cart, start=1)\`** gives a counter with each item, cleaner than \`range(len(...))\`.
- **\`while\` retry**: up to 3 payment attempts, with \`break\` on success. Forgetting \`attempt += 1\` would loop forever.
- **\`continue\`** skips odd numbers so only even numbers are added.

The payment succeeds on attempt 3 by design, so the output is deterministic.`,
        },
        codeJs: `const cart = [["Masala Dosa", 120, 2], ["Filter Coffee", 40, 3], ["Vada", 30, 1]];

let total = 0;
for (const [name, price, qty] of cart) {
  total += price * qty;
}
console.log("Total:", total);

cart.forEach(([name, price, qty], index) => {
  console.log(index + 1, name, price * qty);
});

let attempt = 1;
while (attempt <= 3) {
  const success = attempt === 3;
  console.log("Payment attempt", attempt, "->", success ? "OK" : "failed");
  if (success) break;
  attempt += 1;
}

let evenSum = 0;
for (let n = 1; n <= 10; n++) {
  if (n % 2 === 1) continue;
  evenSum += n;
}
console.log("Sum of even numbers 1-10:", evenSum);`,
        codePython: `cart = [("Masala Dosa", 120, 2), ("Filter Coffee", 40, 3), ("Vada", 30, 1)]

total = 0
for name, price, qty in cart:
    total += price * qty
print("Total:", total)

for i, (name, price, qty) in enumerate(cart, start=1):
    print(i, name, price * qty)

attempt = 1
while attempt <= 3:
    success = attempt == 3
    print("Payment attempt", attempt, "->", "OK" if success else "failed")
    if success:
        break
    attempt += 1

even_sum = 0
for n in range(1, 11):
    if n % 2 == 1:
        continue
    even_sum += n
print("Sum of even numbers 1-10:", even_sum)`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **Infinite \`while\` loop** — counter badhana bhool gaye: \`while i < 5: print(i)\`. Program kabhi ruk ta hi nahi.
2. **Off-by-one** — \`range(1, 10)\` mein 10 **nahi** aata. 1 se 10 chahiye toh \`range(1, 11)\`.
3. **Loop chalate-chalate list badalna** — \`for x in nums: nums.remove(x)\` items skip kar deta hai. Nayi list banao ya copy pe loop chalao: \`for x in nums[:]\`.
4. **\`range(len(lst))\` everywhere** — \`for i in range(len(names)): print(names[i])\` chalega, par \`for name in names\` ya \`enumerate\` zyada saaf hai.
5. **Loop variable ko andar overwrite karna** — \`for i in range(5): i = 10\` se loop pe asar nahi padta; confusing code hai.`,
          en: `1. **Infinite \`while\` loops** from forgetting to update the counter.
2. **Off-by-one errors**: \`range(1, 10)\` stops at 9; use \`range(1, 11)\` for 1 to 10.
3. **Changing a list while looping over it**, e.g. removing items, which skips elements. Loop over a copy or build a new list.
4. **Using \`range(len(lst))\` everywhere** instead of iterating directly or using \`enumerate\`.
5. **Reassigning the loop variable** inside the body, which does not affect the loop and confuses readers.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Loop gadbad kar raha hai? Ye karo:

- **Har iteration print karo:** \`print(f"i={i}, total={total}")\`. Pehle 2–3 rounds dekh ke hi bug dikh jaata hai.
- **Chhota input lo** — 10 lakh items nahi, 3 items. Haath se (paper pe) expected values likho, phir compare.
- **Infinite loop mein phans gaye?** Terminal mein \`Ctrl + C\` dabao. Phir check karo: condition mein jo variable hai, wo loop ke andar badal raha hai ya nahi?
- **Edge cases:** empty list, ek item wali list, aur pehla/aakhri item. Off-by-one bugs yahin pakde jaate hain.
- VS Code debugger mein loop ke andar breakpoint lagao aur **Continue (F5)** dabate jao — har round mein variables live dikhenge.`,
          en: `When a loop misbehaves:

- **Print every iteration**, e.g. \`print(f"i={i}, total={total}")\`; the bug usually shows within 2–3 rounds.
- **Use a tiny input** and work out expected values on paper.
- **Stuck in an infinite loop?** Press \`Ctrl + C\`, then check whether the condition's variable changes inside the loop.
- **Test edge cases**: empty list, single item, first and last items.
- Set a breakpoint inside the loop and press Continue to watch variables each round.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Python ke \`for\` loops **slow** hote hain C/Java ke comparison mein, kyunki har step pe interpreter kaam karta hai. Kab kya use karein:

- **Built-ins pehle:** \`sum(prices)\`, \`max(marks)\`, \`any(...)\`, \`sorted(...)\` — ye andar C mein chalte hain, tumhare loop se tez aur saaf.
- **List comprehension:** \`squares = [n * n for n in nums]\` — chhoti transformations ke liye loop + append se behtar.
- **Bada numeric data?** NumPy/pandas use karo (vectorization) — lakhon rows pe Python loop bahut slow hai.
- **\`for\` vs \`while\`:** count pata hai ya collection pe ghoomna hai → \`for\`. Condition-based (retry, game loop) → \`while\`.

Par yaad rakho: pehle sahi aur readable loop likho, optimisation baad mein, jab measure karke pata chale ki slow hai.`,
          en: `Python \`for\` loops are slower than loops in C or Java because the interpreter does work on every step.

- **Prefer built-ins** like \`sum\`, \`max\`, \`any\` and \`sorted\`, which run in C.
- **List comprehensions** are cleaner for small transformations: \`[n * n for n in nums]\`.
- **Large numeric data** belongs in NumPy or pandas (vectorization).
- **\`for\` vs \`while\`**: iterate a collection or known count with \`for\`; use \`while\` for condition-based repetition like retries.

Write a correct, readable loop first and optimise only after measuring.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real backend mein ek common pattern hai **retry with limit** — jaise payment gateway ya SMS API kabhi-kabhi fail hoti hai:

\`\`\`python
MAX_TRIES = 3
for attempt in range(1, MAX_TRIES + 1):
    ok = send_sms(phone, otp)
    if ok:
        break
    time.sleep(2 ** attempt)  # 2s, 4s, 8s: exponential backoff
else:
    log_error("SMS failed after 3 tries")
\`\`\`

Dekho kya ho raha hai: \`for\` se attempts limited hain (infinite retry nahi), success pe \`break\`, aur \`for ... else\` tab chalta hai jab **teeno attempts fail** ho gaye. Har attempt ke baad wait double hota hai — isko **exponential backoff** kehte hain, taaki failing server pe aur load na pade. Ye pattern tumhe AWS SDKs aur bahut saari libraries mein milega.`,
          en: `A common backend pattern is **retry with a limit**, for flaky payment or SMS APIs:

\`\`\`python
MAX_TRIES = 3
for attempt in range(1, MAX_TRIES + 1):
    ok = send_sms(phone, otp)
    if ok:
        break
    time.sleep(2 ** attempt)  # exponential backoff
else:
    log_error("SMS failed after 3 tries")
\`\`\`

The \`for\` limits attempts, \`break\` stops on success, and \`for ... else\` runs only when all attempts failed. Doubling the wait is called **exponential backoff** and is used by many SDKs, including AWS's.`,
        },
      },
    ],
    visualization: {
      kind: "CODE_EXECUTION",
      title: "for price in [120, 80, 50]: total += price",
      steps: [
        {
          title: "Start",
          description: "total = 0. Python calls iter() on the list to get an iterator positioned before the first item.",
          highlight: "total = 0",
        },
        {
          title: "Round 1",
          description: "next() gives 120. Body runs: total = 0 + 120.",
          highlight: "price = 120, total = 120",
        },
        {
          title: "Round 2",
          description: "next() gives 80. total = 120 + 80.",
          highlight: "price = 80, total = 200",
        },
        {
          title: "Round 3",
          description: "next() gives 50. total = 200 + 50.",
          highlight: "price = 50, total = 250",
        },
        {
          title: "StopIteration",
          description: "next() has nothing left and raises StopIteration. The for loop catches it and ends quietly; code after the loop runs.",
          highlight: "total = 250",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which numbers does `range(1, 5)` produce?",
        options: ["1, 2, 3, 4, 5", "1, 2, 3, 4", "0, 1, 2, 3, 4", "2, 3, 4, 5"],
        correct: [1],
        explanation: "`range(start, stop)` stop ko include nahi karta. Isliye 1, 2, 3, 4 — 5 nahi.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `continue` do inside a loop?",
        options: [
          "Stops the loop completely",
          "Skips the rest of this iteration and moves to the next one",
          "Restarts the loop from the first item",
          "Pauses the program",
        ],
        correct: [1],
        explanation: "`continue` current round ka bacha hua code skip karke agle round pe chala jaata hai. Loop khatam `break` karta hai.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "You need to keep asking for an OTP until the user enters the correct one. Which loop fits best?",
        options: [
          "for loop over range(10)",
          "while loop with a condition",
          "No loop, an if is enough",
          "for loop over the OTP string",
        ],
        correct: [1],
        explanation: "Kitni baar poochna padega pata nahi — condition-based repeat hai, toh `while`.",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these loops never end (assume i starts at 0 and nothing else changes)?",
        options: [
          "while True: print('hi')",
          "while i < 5: print(i)",
          "for i in range(5): print(i)",
          "while i < 5: i += 1",
        ],
        correct: [0, 1],
        explanation: "Pehle mein break nahi hai; dusre mein `i` kabhi badhta nahi. `for` over `range(5)` 5 baar chal ke rukta hai, aur `i += 1` wala `while` bhi ruk jaayega.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 1,
        prompt: "What does this code print?",
        code: `total = 0
for i in range(1, 6):
    if i == 3:
        continue
    total += i
print(total)`,
        codeLanguage: "python",
        options: ["15", "12", "3", "10"],
        correct: [1],
        explanation: "i = 3 pe `continue` hua, toh 3 nahi juda. 1 + 2 + 4 + 5 = 12.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `n = 10
count = 0
while n > 1:
    n = n // 2
    count += 1
print(count, n)`,
        codeLanguage: "python",
        options: ["3 1", "4 0", "5 1", "3 2"],
        correct: [0],
        explanation: "10 → 5 → 2 → 1. Teen baar divide hua, aur n = 1 pe condition `n > 1` False. Output `3 1`. (Ye log2 jaisa pattern hai — Big-O mein dobara milega.)",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "Your script calls a flaky SMS API. It should try at most 3 times and stop as soon as one call succeeds. What is the cleanest structure?",
        options: [
          "for attempt in range(3) with break on success",
          "while True loop that retries until success",
          "Copy-paste the call three times",
          "A recursive function with no limit",
        ],
        correct: [0],
        explanation: "Fixed maximum attempts → `for` over `range(3)`, success pe `break`. `while True` bina limit ke server pe hamla kar sakta hai; recursion yahan overkill hai.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 3,
        prompt: "Order what Python does internally for `for x in items:`.",
        options: [
          "Call iter(items) to get an iterator",
          "Call next() on the iterator and bind the value to x",
          "Run the loop body",
          "Repeat next() until StopIteration is raised, then exit the loop",
        ],
        explanation: "Pehle iterator banta hai, phir har round `next()`, body, aur end mein `StopIteration` loop ko khatam karta hai.",
      },
      {
        type: "EXPLAIN",
        difficulty: 1,
        prompt: "When would you use a for loop and when a while loop? Give one example of each.",
        keywords: ["known", "condition", "iterable", "infinite"],
        explanation: "`for` jab collection ya fixed count pe ghoomna ho (cart ke items). `while` jab condition-based repeat ho aur count pata na ho (OTP sahi hone tak). `while` mein exit condition ka dhyaan rakho warna infinite loop.",
      },
    ],
    buildTask: {
      title: "Count the vowels",
      description: `Function \`countVowels(s)\` likho jo string \`s\` mein vowels (a, e, i, o, u) ginke number return kare.

- Uppercase aur lowercase dono count honge (\`"A"\` bhi vowel hai).
- \`y\` vowel **nahi** hai.
- Empty string pe \`0\`.

Example: \`countVowels("Prompters India")\` → \`5\``,
      functionName: "countVowels",
      starterJs: `function countVowels(s) {
  // TODO: loop over each character and count a, e, i, o, u (any case)
}`,
      starterPython: `def countVowels(s):
    # TODO: loop over each character and count a, e, i, o, u (any case)
    pass`,
      tests: [
        {
          name: "hello has 2",
          args: ["hello"],
          expected: 2,
        },
        {
          name: "RHYTHM has none (y is not a vowel)",
          args: ["RHYTHM"],
          expected: 0,
        },
        {
          name: "mixed case sentence",
          args: ["Prompters India"],
          expected: 5,
        },
        {
          name: "empty string",
          args: [""],
          expected: 0,
        },
        {
          name: "single vowel",
          args: ["u"],
          expected: 1,
        },
        {
          name: "all vowels both cases",
          args: ["AEIOUaeiou"],
          expected: 10,
          hidden: true,
        },
        {
          name: "chai pe charcha",
          args: ["chai pe charcha"],
          expected: 5,
          hidden: true,
        },
      ],
      hints: [
        "String pe `for ch in s` se har character mil jaata hai. Har character ko lowercase karke check karo ki wo vowels ke group mein hai ya nahi.",
        "Step 1: count = 0. Step 2: har ch ke liye agar ch.lower() \"aeiou\" mein hai toh count += 1. Step 3: loop ke baad count return karo.",
        `count = 0
for ch in s:
    if ch.lower() in "aeiou":
        count += 1
# return ...`,
      ],
      explainQuestions: [
        {
          question: "How did you handle uppercase vowels?",
          keywords: ["lower", "case", "convert"],
        },
        {
          question: "What does your function return for an empty string and why?",
          keywords: ["zero", "loop does not run", "initial"],
        },
        {
          question: "How many times does your loop run for a string of length n?",
          keywords: ["n times", "each character", "once"],
        },
      ],
      estMinutes: 12,
    },
    interview: [
      {
        question: "How does a for loop work internally in Python?",
        short: "A for loop calls iter() on the iterable to get an iterator, then repeatedly calls next() and binds each value to the loop variable. When the iterator raises StopIteration, the loop ends. That is why for works on lists, strings, dicts, files, generators and anything else that implements the iterator protocol.",
        deep: `Equivalent code:
\`\`\`python
it = iter(items)
while True:
    try:
        x = next(it)
    except StopIteration:
        break
    ...  # body
\`\`\`
- An **iterable** has \`__iter__\`; an **iterator** has \`__next__\` and remembers position.
- \`range\` and generators are lazy, so they do not build the whole sequence in memory.
- Loop \`else\` runs only when the loop was not exited by \`break\`.`,
        followUps: [
          "What is the difference between an iterable and an iterator?",
          "Why is range memory-efficient?",
          "When does a for-else block run?",
        ],
        commonMistake: "Saying for loops work by indexing (items[0], items[1], ...). They use iterators, which is why sets and generators work too.",
        keywords: ["iter", "next", "stopiteration", "iterable", "iterator protocol"],
        difficulty: 2,
        roles: ["SDE", "BACKEND"],
      },
      {
        question: "for vs while: when do you use which?",
        short: "Use for when iterating over a collection or a known number of times; it is safer because it cannot run forever. Use while when repetition depends on a condition whose number of rounds is unknown, like retrying until success or reading until end of input, and make sure the condition eventually becomes false.",
        deep: `- \`for\` is bounded by the iterable, so it avoids infinite loops by design.
- \`while\` needs a variable in the condition that changes inside the body.
- Many \`while\` loops can be rewritten as \`for attempt in range(MAX)\` to add a safety limit.`,
        followUps: [
          "How would you add a safety limit to a while loop?",
          "What is an off-by-one error?",
          "Why is modifying a list while iterating over it dangerous?",
        ],
        commonMistake: "Using while with a manual counter for simple iteration over a list, which adds off-by-one risk.",
        keywords: ["known count", "condition", "infinite loop", "iterable"],
        difficulty: 1,
        roles: ["SDE", "BACKEND", "FRONTEND"],
      },
    ],
  },
  {
    slug: "py-functions",
    estMinutes: 45,
    difficulty: 1,
    prerequisites: ["py-loops"],
    objectives: [
      "Define functions with parameters, default values and return values",
      "Explain the difference between printing and returning a value",
      "Describe what happens on the call stack and in local scope when a function is called",
      "Avoid the mutable default argument bug and write small, testable functions",
    ],
    technicalDefinition: "A function is a named, reusable block of code defined with `def` that receives arguments bound to its parameters in a new local scope, executes, and returns a value to the caller (None if no return statement runs).",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Function** ek naam wala code ka dabba hai jo input leta hai, kaam karta hai, aur output **return** karta hai.

\`\`\`python
def add_gst(amount, gst_percent=5):
    return amount + amount * gst_percent // 100
\`\`\`

- \`def\` — function define karne ka keyword.
- \`amount\`, \`gst_percent\` — **parameters** (inputs ke naam). \`gst_percent=5\` ek **default value** hai.
- \`return\` — result caller ko wapas bhejta hai.

Call karte waqt jo values dete ho (\`add_gst(200)\`) unhe **arguments** kehte hain. Agar \`return\` nahi likha, function \`None\` return karta hai.`,
          en: `A **function** is a named block of code that takes input, does some work and **returns** an output.

- \`def\` defines the function.
- \`amount\` and \`gst_percent\` are **parameters**; \`gst_percent=5\` is a **default value**.
- \`return\` sends the result back to the caller.

The values you pass when calling, as in \`add_gst(200)\`, are **arguments**. A function without a \`return\` gives back \`None\`.`,
          hi: `**फ़ंक्शन** कोड का एक नाम वाला डिब्बा है जो इनपुट लेता है, काम करता है और नतीजा **return** करता है।

- \`def\` — फ़ंक्शन बनाने का कीवर्ड।
- \`amount\`, \`gst_percent\` — **पैरामीटर** (इनपुट के नाम)। \`gst_percent=5\` एक **डिफ़ॉल्ट वैल्यू** है।
- \`return\` — नतीजा बुलाने वाले को वापस भेजता है।

कॉल करते समय जो वैल्यू देते हैं (\`add_gst(200)\`), उन्हें **आर्ग्युमेंट** कहते हैं। अगर \`return\` नहीं लिखा, तो फ़ंक्शन \`None\` लौटाता है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `College ke bahar wala **chai stall** socho.

- Tum bolte ho: "Bhaiya, ek chai — kam cheeni, extra adrak." Ye tumhare **arguments** hain.
- Bhaiya ki recipe fix hai — paani, doodh, patti, ubaal. Ye **function body** hai. Har baar recipe dobara likhni nahi padti.
- Tumhe haath mein **cup milta hai** — ye **return value** hai. Tum usse pi sakte ho, dost ko de sakte ho, kuch bhi.
- Kuch na bolo toh "normal cheeni" — ye **default parameter** hai.

Ab farq samjho: agar bhaiya chai banake **sirf dikha de** aur cup na de — wo \`print\` hai. Tumhe dikh gayi, par haath mein kuch nahi aaya. \`return\` matlab cup tumhare haath mein.`,
          en: `Think of the **tea stall** outside college.

- You say "one tea, less sugar, extra ginger": these are your **arguments**.
- The recipe is fixed and reused every time: that is the **function body**.
- You get **a cup in your hand**: that is the **return value**, which you can drink or pass on.
- Say nothing about sugar and you get the usual amount: a **default parameter**.

If the vendor only showed you the tea without handing it over, that is \`print\`. \`return\` puts the cup in your hand.`,
          hi: `कॉलेज के बाहर की **चाय की दुकान** सोचिए।

- आप कहते हैं: "भैया, एक चाय — कम चीनी, ज़्यादा अदरक।" ये आपके **आर्ग्युमेंट** हैं।
- भैया की रेसिपी तय है — यही **फ़ंक्शन बॉडी** है, जो हर बार दोबारा इस्तेमाल होती है।
- आपके हाथ में **कप आता है** — यही **return वैल्यू** है।
- चीनी के बारे में कुछ न कहें तो "नॉर्मल चीनी" — यह **डिफ़ॉल्ट पैरामीटर** है।

अगर भैया चाय सिर्फ़ दिखा दें और कप न दें, तो वह \`print\` है। \`return\` मतलब कप आपके हाथ में।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Bina functions ke tumhara code ek lamba copy-paste ka dher ban jaata hai. Socho GST calculate karne ka logic 10 jagah likha hai, aur sarkar ne rate badal diya — ab 10 jagah change karo, aur ek jagah bhool gaye toh bug.

Functions se:
- **DRY (Don't Repeat Yourself)** — logic ek jagah, use 100 jagah.
- **Naam se samajh aata hai** — \`calculate_delivery_fee(distance)\` padh ke hi pata chal gaya kya hota hai.
- **Testing aasaan** — ek chhota function alag se test kar sakte ho: \`assert add_gst(200) == 210\`.
- **Teamwork** — ek dost payment function likhe, dusra cart function. Bas input-output fix karo.`,
          en: `Without functions code becomes a long pile of copy-paste. If the GST logic is written in 10 places and the rate changes, you must update all 10 and will probably miss one.

Functions give you:
- **DRY**: logic lives in one place and is reused everywhere.
- **Readable names**: \`calculate_delivery_fee(distance)\` explains itself.
- **Easy testing**: \`assert add_gst(200) == 210\`.
- **Teamwork**: people agree on inputs and outputs and work in parallel.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Real Python systems poore ke poore functions pe chalte hain:

- **Instagram** ka backend **Django** pe bana hai. Django mein ek URL ko handle karne wala code ek **view function** ho sakta hai: request aayi → function chala → response return hua.
- **AWS Lambda** — tum ek Python function likhte ho jaise \`def lambda_handler(event, context):\` aur AWS usse har event (API call, file upload) pe call karta hai. Server manage karna hi nahi padta — isliye isse "serverless" kehte hain.
- **FastAPI / Flask** — har API endpoint ek decorated function hai: \`@app.get("/orders")\` ke neeche \`def list_orders():\`. Startups mein Python APIs aksar aise hi bante hain.`,
          en: `Real Python systems are built from functions:

- **Instagram** runs on **Django**, where a URL can be handled by a **view function**: request in, response returned.
- **AWS Lambda** runs a Python function like \`def lambda_handler(event, context):\` for each event, without you managing servers.
- In **FastAPI or Flask**, every endpoint is a decorated function, e.g. \`@app.get("/orders")\` above \`def list_orders():\`.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `\`def\` likhte hi kya hota hai? Python ek **function object** banata hai aur usse naam (\`add_gst\`) se bind kar deta hai. Function bhi ek value hai — tum usse variable mein rakh sakte ho, dusre function ko de sakte ho.

Call \`add_gst(200)\` pe:
1. Arguments evaluate hote hain.
2. Ek naya **frame** (local scope) banta hai aur **call stack** pe push hota hai.
3. Parameters frame mein bind hote hain: \`amount → 200\`. Python objects ke **reference** pass karta hai — isliye function list ko modify kare toh caller ko bhi dikhega.
4. Body chalti hai. \`return\` pe value caller ko milti hai, frame stack se pop ho jaata hai aur local variables khatam.

Naam dhoondhne ka rule **LEGB**: Local → Enclosing → Global → Built-in.

Important: **default values sirf ek baar** banti hain — jab \`def\` chalta hai, har call pe nahi.`,
          en: `\`def\` creates a **function object** and binds it to a name; functions are values you can store and pass around.

On a call like \`add_gst(200)\`:
1. Arguments are evaluated.
2. A new **frame** (local scope) is pushed onto the **call stack**.
3. Parameters are bound in that frame. Python passes **object references**, so a function that mutates a list changes the caller's list too.
4. The body runs; \`return\` hands back a value and the frame is popped.

Names are resolved with **LEGB**: Local, Enclosing, Global, Built-in. **Default values are created once**, when \`def\` runs.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Code mein dekho:

- \`add_gst(amount, gst_percent=5)\` — default 5%. Integer maths (\`//\`) taaki output exact rahe.
- \`split_bill\` **do values return** karta hai — Python mein asal mein ek tuple jaata hai, jise \`share, left = ...\` se unpack kiya.
- Call teen tareeke se: positional (\`add_gst(200)\`), override default (\`add_gst(200, 18)\`), aur **keyword** (\`gst_percent=12, amount=100\`) — keyword args mein order matter nahi karta.
- \`say_hi\` mein \`return\` nahi hai → result \`None\`. Print aur return ka farq yahin dikhta hai.
- Last mein \`add_item\` — mutable default ka sahi tareeka: \`None\` default, andar nayi list. (JS mein default har call pe naya banta hai, isliye wahan \`cart = []\` safe hai — Python mein nahi!)`,
          en: `What to notice:

- \`add_gst\` has a default of 5% and uses integer maths so results are exact.
- \`split_bill\` **returns two values** (really a tuple), unpacked into \`share, left\`.
- Three call styles: positional, overriding the default, and **keyword arguments** where order does not matter.
- \`say_hi\` has no \`return\`, so it returns \`None\`.
- \`add_item\` shows the safe pattern for list defaults: default \`None\`, create the list inside. JavaScript re-creates defaults on every call, so \`cart = []\` is safe there but not in Python.`,
        },
        codeJs: `function addGst(amount, gstPercent = 5) {
  return amount + Math.floor((amount * gstPercent) / 100);
}

function splitBill(total, people) {
  const share = Math.floor(total / people);
  const left = total - share * people;
  return [share, left];
}

function sayHi(name) {
  console.log("Hi", name);
}

console.log(addGst(200));
console.log(addGst(200, 18));
console.log(addGst(100, 12));

const [share, left] = splitBill(1000, 3);
console.log("Each pays", share, "and", left, "rupee is left");

const result = sayHi("Aman");
console.log("sayHi returned:", result);

function addItem(item, cart = []) {
  cart.push(item);
  return cart;
}

console.log(addItem("chai"));
console.log(addItem("samosa"));`,
        codePython: `def add_gst(amount, gst_percent=5):
    return amount + amount * gst_percent // 100

def split_bill(total, people):
    share = total // people
    left = total - share * people
    return share, left

def say_hi(name):
    print("Hi", name)

print(add_gst(200))
print(add_gst(200, 18))
print(add_gst(gst_percent=12, amount=100))

share, left = split_bill(1000, 3)
print("Each pays", share, "and", left, "rupee is left")

result = say_hi("Aman")
print("say_hi returned:", result)

def add_item(item, cart=None):
    if cart is None:
        cart = []
    cart.append(item)
    return cart

print(add_item("chai"))
print(add_item("samosa"))`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **\`print\` ko \`return\` samajhna.** Function andar print karta hai, par caller ko \`None\` milta hai. Phir \`bill + 20\` → TypeError.
2. **Mutable default argument:** \`def add(item, cart=[])\` — ye list **sab calls mein shared** hai, kyunki default ek hi baar bana tha. Use \`cart=None\` aur andar \`[]\`.
3. **Call karna bhool jaana:** \`total = calculate\` (bina \`()\`) function object deta hai, result nahi.
4. **Global variable andar badalna:** function ke andar \`count += 1\` → \`UnboundLocalError\`. Global pe depend mat karo; value parameter se lo aur return karo.
5. **Ek function, das kaam:** validate + calculate + save + email sab ek mein. Chhote functions banao — har ek ek kaam kare.`,
          en: `1. **Confusing \`print\` with \`return\`**: the caller gets \`None\`.
2. **Mutable default arguments** like \`cart=[]\` are shared across calls because defaults are created once. Use \`None\` and create the list inside.
3. **Forgetting the parentheses**: \`total = calculate\` gives the function, not its result.
4. **Modifying a global inside a function** raises \`UnboundLocalError\`; pass values in and return them instead.
5. **One function doing ten jobs**: split it into small single-purpose functions.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Function ka result galat hai? Step by step:

- **Return value print karo:** \`print(repr(my_func(…)))\`. Agar \`None\` aa raha hai → kisi path pe \`return\` missing hai (jaise \`if\` ke andar return hai, \`else\` mein nahi).
- **Entry pe arguments print karo:** function ki pehli line mein \`print("args:", amount, gst_percent)\` — galat input aa raha ho toh yahin dikhega.
- **Traceback ulta padho:** error ka traceback call stack dikhata hai — sabse neeche wali line jahan crash hua, upar wali lines ne wahan tak kaise pahunchaya.
- **Chhote \`assert\` tests:** \`assert add_gst(100) == 105\`. Ek-ek function alag se test karo, poora program nahi.
- Debugger mein **Step Into (F11)** se function ke andar jao, **Step Out** se wapas.`,
          en: `When a function gives the wrong result:

- **Print the return value with \`repr\`**. Getting \`None\` means some path has no \`return\`.
- **Print the arguments on entry** to catch bad inputs.
- **Read the traceback bottom-up**: the last line is where it crashed, the lines above show the call path.
- **Write small asserts** such as \`assert add_gst(100) == 105\`.
- In the debugger, **Step Into** a function and **Step Out** of it.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Functions zaroori hain, par har cheez ka balance hai:

- **Bahut chhote functions** (3-line ka function jo sirf ek jagah use ho) code ko jumping-around bana dete hain. Function tab banao jab logic repeat ho, ya naam dene se samajh badhe.
- **\`lambda\`** chhote one-liner ke liye theek hai: \`sorted(items, key=lambda x: x[1])\`. Lamba logic → proper \`def\`.
- **State yaad rakhni hai** (jaise bank account balance)? Global variables + functions ki jagah **class** better hai.
- **Pure functions** (same input → same output, koi side effect nahi) test karne mein sabse aasaan. Database/email wale kaam alag functions mein rakho.`,
          en: `Functions are essential, but balance matters:

- **Very tiny functions** used once can make code jump around. Create one when logic repeats or a name adds clarity.
- **\`lambda\`** suits one-liners like a sort key; longer logic needs \`def\`.
- **When state must be remembered**, such as an account balance, a **class** beats globals plus functions.
- **Pure functions** (same input, same output, no side effects) are the easiest to test; keep database and email work separate.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek FastAPI order endpoint dekho — kaise kaam functions mein toota hai:

\`\`\`python
@app.post("/orders")
def create_order(payload: OrderIn):
    validate_items(payload.items)
    total = calculate_total(payload.items, payload.coupon)
    order = save_order(payload.user_id, total)
    send_receipt(payload.user_id, order.id)
    return {"order_id": order.id, "total": total}
\`\`\`

Endpoint khud chhota hai — wo bas "manager" hai jo kaam baant raha hai. \`calculate_total\` ek **pure function** hai: bina database ke unit test ho sakta hai. \`save_order\` aur \`send_receipt\` side effects wale hain, alag rakhe, taaki testing mein inko mock kar sako. Jab interviewer pooche "code ko testable kaise banaya?", yahi answer hai.`,
          en: `A FastAPI order endpoint split into functions:

\`\`\`python
@app.post("/orders")
def create_order(payload: OrderIn):
    validate_items(payload.items)
    total = calculate_total(payload.items, payload.coupon)
    order = save_order(payload.user_id, total)
    send_receipt(payload.user_id, order.id)
    return {"order_id": order.id, "total": total}
\`\`\`

The endpoint just coordinates. \`calculate_total\` is a **pure function** you can unit test without a database, while \`save_order\` and \`send_receipt\` hold the side effects and can be mocked in tests. This is a strong answer when an interviewer asks how you made your code testable.`,
        },
      },
    ],
    visualization: {
      kind: "STACK",
      title: "Calling add_gst(200) from main code",
      steps: [
        {
          title: "Module frame",
          description: "The main script is running in the global frame. `add_gst` is already a function object bound to a name.",
          highlight: "stack: [global]",
        },
        {
          title: "Call add_gst(200)",
          description: "Python evaluates the argument and pushes a NEW frame for add_gst on top of the stack.",
          highlight: "stack: [global, add_gst]",
        },
        {
          title: "Bind parameters",
          description: "Inside the new frame: amount → 200, gst_percent → 5 (default). These are local names.",
          highlight: "amount=200, gst_percent=5",
        },
        {
          title: "Run body and return",
          description: "200 + 200 * 5 // 100 = 210. `return` sends 210 back to the caller.",
          highlight: "return 210",
        },
        {
          title: "Frame popped",
          description: "The add_gst frame is destroyed with its locals. The global frame continues with the value 210.",
          highlight: "stack: [global]",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does a Python function return if it has no `return` statement?",
        options: ["0", "An empty string", "None", "It raises an error"],
        correct: [2],
        explanation: "Har function kuch na kuch return karta hai. `return` nahi likha toh `None` milta hai.",
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "When are default parameter values evaluated in Python?",
        options: [
          "Every time the function is called",
          "Once, when the def statement runs",
          "Only when the argument is missing and the function is called for the first time after a restart",
          "At import time of the caller module",
        ],
        correct: [1],
        explanation: "Default value `def` line chalne ke time ek hi baar banti hai. Isliye mutable default (list/dict) sab calls mein shared hota hai.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which lets the caller USE the computed value later, e.g. `bill = total(prices)`?",
        options: ["print(total)", "return total", "Both work the same", "Neither"],
        correct: [1],
        explanation: "`return` value caller ko deta hai. `print` sirf screen pe dikhata hai; caller ko `None` milta hai.",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Given `def greet(name, msg=\"Hi\"):`, which calls are valid?",
        options: [
          "greet(\"Asha\")",
          "greet(\"Asha\", \"Hello\")",
          "greet(msg=\"Yo\", name=\"Asha\")",
          "greet()",
        ],
        correct: [0, 1, 2],
        explanation: "Pehle teeno valid hain — keyword args mein order free hai. `greet()` mein required `name` missing hai → TypeError.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 3,
        prompt: "What does this code print?",
        code: `def add_item(item, cart=[]):
    cart.append(item)
    return cart

print(add_item("chai"))
print(add_item("samosa"))`,
        codeLanguage: "python",
        options: [
          `['chai']
['samosa']`,
          `['chai']
['chai', 'samosa']`,
          `['chai', 'samosa']
['chai', 'samosa']`,
          "TypeError",
        ],
        correct: [1],
        explanation: "Default list `[]` sirf ek baar bani thi. Dono calls same list mein append kar rahi hain, isliye dusri call mein `chai` bhi dikhta hai. Fix: `cart=None`.",
      },
      {
        type: "SPOT_BUG",
        difficulty: 1,
        prompt: "This code crashes on the last line. What is the bug?",
        code: `def total_price(prices):
    total = 0
    for p in prices:
        total += p
    print(total)

bill = total_price([100, 50])
print("Bill:", bill + 20)`,
        codeLanguage: "python",
        options: [
          "The loop should use range(len(prices))",
          "The function prints instead of returning, so bill is None",
          "total should start at 1",
          "prices must be a tuple",
        ],
        correct: [1],
        explanation: "`total_price` print karta hai par return nahi karta, isliye `bill` `None` hai aur `None + 20` TypeError deta hai. `print(total)` ki jagah `return total` likho.",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "The GST calculation is copy-pasted in 6 files. The tax rate changes next month. What should you do?",
        options: [
          "Update all 6 copies carefully",
          "Move the logic into one function like calculate_gst() and call it everywhere",
          "Store the rate in each file as a global variable",
          "Add comments reminding people to update all copies",
        ],
        correct: [1],
        explanation: "Logic ko ek function mein nikalo aur sab jagah use karo — rate badle toh ek hi jagah change. Ye DRY principle hai.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order what happens when Python runs `x = add_gst(200)`.",
        options: [
          "Evaluate the argument 200",
          "Push a new frame and bind parameters (amount = 200)",
          "Run the function body",
          "Return the value, pop the frame and bind it to x",
        ],
        explanation: "Arguments → naya frame → params bind → body → return value caller ko, frame pop → x mein store.",
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why is a mutable default argument like `cart=[]` dangerous, and how do you fix it?",
        keywords: ["evaluated once", "shared", "none", "new list"],
        explanation: "Default value def ke time ek hi baar banti hai, toh sab calls same list share karti hain — purana data leak hota hai. Fix: `cart=None` default rakho aur function ke andar `if cart is None: cart = []`.",
      },
    ],
    buildTask: {
      title: "FizzBuzz as a function",
      description: `Classic interview warm-up, par print nahi — **return** karna hai!

Function \`fizzBuzz(n)\` likho jo 1 se \`n\` tak ke liye **list of strings** return kare:
- 3 se divisible → \`"Fizz"\`
- 5 se divisible → \`"Buzz"\`
- 3 aur 5 dono se → \`"FizzBuzz"\`
- warna number khud, **string** mein (\`"7"\`)

\`n = 0\` ho toh empty list \`[]\`.

Example: \`fizzBuzz(5)\` → \`["1", "2", "Fizz", "4", "Buzz"]\``,
      functionName: "fizzBuzz",
      starterJs: `function fizzBuzz(n) {
  const result = [];
  // TODO: fill result for numbers 1..n
  return result;
}`,
      starterPython: `def fizzBuzz(n):
    result = []
    # TODO: fill result for numbers 1..n
    return result`,
      tests: [
        {
          name: "n = 5",
          args: [5],
          expected: ["1", "2", "Fizz", "4", "Buzz"],
        },
        {
          name: "n = 1",
          args: [1],
          expected: ["1"],
        },
        {
          name: "n = 0 gives empty list",
          args: [0],
          expected: [],
        },
        {
          name: "n = 3",
          args: [3],
          expected: ["1", "2", "Fizz"],
        },
        {
          name: "n = 10",
          args: [10],
          expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz"],
        },
        {
          name: "n = 15 includes FizzBuzz",
          args: [15],
          expected: [
            "1",
            "2",
            "Fizz",
            "4",
            "Buzz",
            "Fizz",
            "7",
            "8",
            "Fizz",
            "Buzz",
            "11",
            "Fizz",
            "13",
            "14",
            "FizzBuzz",
          ],
          hidden: true,
        },
        {
          name: "n = 16",
          args: [16],
          expected: [
            "1",
            "2",
            "Fizz",
            "4",
            "Buzz",
            "Fizz",
            "7",
            "8",
            "Fizz",
            "Buzz",
            "11",
            "Fizz",
            "13",
            "14",
            "FizzBuzz",
            "16",
          ],
          hidden: true,
        },
      ],
      hints: [
        "Function ko list banake return karni hai. Har number ke liye ek string decide karo — aur 15 jaise numbers (dono se divisible) ka case sabse pehle check karo.",
        "Step 1: 1 se n tak loop. Step 2: i % 15 == 0 → \"FizzBuzz\", elif i % 3 == 0 → \"Fizz\", elif i % 5 == 0 → \"Buzz\", warna str(i). Step 3: append, aur loop ke baad return.",
        `for i in range(1, n + 1):
    if i % 15 == 0:
        result.append("FizzBuzz")
    elif i % 3 == 0:
        ...`,
      ],
      explainQuestions: [
        {
          question: "Why must the 'divisible by both' check come before the others?",
          keywords: ["first", "15", "order", "elif"],
        },
        {
          question: "Why does this function return a list instead of printing?",
          keywords: ["return", "reuse", "test", "caller"],
        },
        {
          question: "How did you convert plain numbers, and why does it matter for the tests?",
          keywords: ["str", "string", "type"],
        },
      ],
      estMinutes: 12,
    },
    interview: [
      {
        question: "What is the difference between print and return in a function?",
        short: "return hands a value back to the caller so it can be stored, combined or tested; the function ends there. print only writes text to the console and the function still returns None unless it has a return. Business logic should return values; printing belongs at the edges, like a CLI or logs.",
        deep: `\`\`\`python
def a(): print(5)
def b(): return 5
a() + 1   # TypeError: None + 1
b() + 1   # 6
\`\`\`
- Returning makes functions composable and unit-testable.
- \`return\` also exits immediately, so it is used for early exits (guard clauses).`,
        followUps: [
          "What does a function return when it has no return statement?",
          "Can a function return multiple values?",
          "Why are pure functions easier to test?",
        ],
        commonMistake: "Believing a function that prints a value has 'returned' it.",
        keywords: ["return", "caller", "none", "print", "testable"],
        difficulty: 1,
        roles: ["SDE", "BACKEND"],
      },
      {
        question: "Explain the mutable default argument problem in Python.",
        short: "Default values are evaluated once, when the def statement runs, not on every call. If the default is a mutable object like a list or dict, all calls share the same object, so data from one call leaks into the next. The fix is to use None as the default and create a new object inside the function.",
        deep: `\`\`\`python
def add(x, bucket=[]):      # shared list!
    bucket.append(x); return bucket
add(1)  # [1]
add(2)  # [1, 2]

def add(x, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(x); return bucket
\`\`\`
The function object stores defaults in \`add.__defaults__\`, which is why the state persists. Linters like pylint warn about this (\`dangerous-default-value\`).`,
        followUps: [
          "Where are default values stored?",
          "Is this ever used intentionally?",
          "Does JavaScript have the same problem?",
        ],
        commonMistake: "Saying Python creates the default list fresh for every call.",
        keywords: ["evaluated once", "def time", "shared object", "none default"],
        difficulty: 2,
        roles: ["SDE", "BACKEND", "AI"],
      },
    ],
    promptCard: {
      title: "Review my Python function like a senior engineer",
      category: "CODE_REVIEW",
      task: "Get a beginner-friendly code review of a single Python function covering correctness, naming, edge cases and testability.",
      whenToUse: "After you write a function and it 'works', before you commit it or submit it in an assignment or project.",
      template: `You are a senior Python engineer reviewing a beginner's code. Be kind but specific.

Here is my function:
\`\`\`python
[PASTE_FUNCTION]
\`\`\`

What it should do: [WHAT_IT_SHOULD_DO]
Example input and expected output: [EXAMPLE_INPUT_OUTPUT]

Please review it in this order:
1. Correctness: any input where it gives a wrong result or crashes? List the exact inputs.
2. Edge cases I missed (empty input, zero, negatives, None, very large values).
3. print vs return, side effects and mutable default arguments.
4. Naming and readability.
5. Write 5 assert-based tests I can run.

Do NOT rewrite the whole function. Point to the lines and explain why, then show only the changed lines.`,
      variables: [
        {
          key: "PASTE_FUNCTION",
          label: "Your complete function code",
        },
        {
          key: "WHAT_IT_SHOULD_DO",
          label: "One or two lines on what the function should do",
        },
        {
          key: "EXAMPLE_INPUT_OUTPUT",
          label: "One example call and the result you expect",
        },
      ],
      whyItWorks: [
        {
          part: "Senior engineer role, kind but specific",
          why: "Sets the depth and tone so feedback is actionable rather than vague praise.",
        },
        {
          part: "Expected behaviour and an example",
          why: "The AI cannot judge correctness without knowing what 'correct' means.",
        },
        {
          part: "Ordered checklist",
          why: "Forces coverage of the beginner bugs that matter most: edge cases, print vs return, mutable defaults.",
        },
        {
          part: "Don't rewrite the whole function",
          why: "Keeps you learning by fixing your own code instead of copy-pasting a new version.",
        },
      ],
      verifyChecklist: [
        "Run every assert test it suggests; delete any test that is itself wrong.",
        "Try at least one edge case it mentioned by hand.",
        "Make sure suggested changes keep the same function name and parameters your callers use.",
        "Re-run your whole program after applying changes.",
      ],
      sampleOutput: `1. Correctness: \`average([])\` raises ZeroDivisionError at line 4 (\`return total / len(nums)\`).
2. Edge cases: empty list, negative numbers are fine, None would crash on the loop.
3. You print the result on line 5 and also return it; remove the print so callers stay clean.
4. Rename \`l\` to \`nums\`; single letters are hard to read.
5. Tests:
   assert average([2, 4]) == 3
   assert average([5]) == 5
   ...`,
    },
  },
  {
    slug: "py-lists-tuples",
    estMinutes: 45,
    difficulty: 1,
    prerequisites: ["py-loops", "py-functions"],
    objectives: [
      "Create, index, slice and modify lists with append, insert, pop and sort",
      "Use tuples for fixed records and unpack them into variables",
      "Explain aliasing (b = a) versus copying and avoid the shared-list bug",
      "Know the cost of common list operations (append O(1), insert at 0 O(n))",
    ],
    technicalDefinition: "A list is an ordered, mutable, dynamically resized array of object references; a tuple is an ordered, immutable sequence that is hashable when all its elements are hashable.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**List** ek ordered collection hai jisme tum kai values ek saath rakh sakte ho, aur baad mein **badal** bhi sakte ho:

\`\`\`python
cart = ["dosa", "coffee", "vada"]
cart.append("idli")    # add
cart[0] = "upma"       # change
\`\`\`

**Tuple** bhi ordered hai, par **badal nahi sakte** (immutable):

\`\`\`python
location = (28.61, 77.20)   # (lat, lng)
\`\`\`

Dono mein **index 0 se shuru** hota hai: \`cart[0]\` pehla item, \`cart[-1]\` aakhri. **Slicing** se tukda nikalo: \`cart[1:3]\`.`,
          en: `A **list** is an ordered collection that holds many values and can be **changed** later: you can append, replace and remove items.

A **tuple** is also ordered but **cannot be changed** (immutable), e.g. \`location = (28.61, 77.20)\`.

Both are **indexed from 0**: \`cart[0]\` is the first item and \`cart[-1]\` the last. **Slicing** like \`cart[1:3]\` returns a part of the sequence.`,
          hi: `**लिस्ट** एक क्रम वाला संग्रह है जिसमें कई वैल्यू एक साथ रख सकते हैं और बाद में **बदल** भी सकते हैं — जोड़ना, हटाना, बदलना।

**टपल** भी क्रम वाला है, पर उसे **बदला नहीं जा सकता** (immutable), जैसे \`location = (28.61, 77.20)\`।

दोनों में **इंडेक्स 0 से शुरू** होता है: \`cart[0]\` पहला आइटम, \`cart[-1]\` आखिरी। **स्लाइसिंग** \`cart[1:3]\` से एक हिस्सा निकलता है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**List** = sabzi ki list jo tum **pencil** se likhte ho. Mummy ne bola "dhaniya bhi le aana" — add kar diya. Tamatar sasta nahi mila — kaat diya. Order bhi badal sakte ho. Flexible!

**Tuple** = tumhara **train ticket**. PNR, coach, seat number — \`("B4", 32, "Lower")\`. Ek baar ban gaya toh pen se badal nahi sakte; badalna hai toh **naya ticket** banwao. Isi wajah se TC usse bharose ke saath check karta hai.

Aur **index** = local train ke coaches ki numbering. Engine ke baad pehla coach 0 number (programmers ki duniya mein!), aur \`-1\` matlab sabse aakhri coach — guard wala.`,
          en: `A **list** is a shopping list written in **pencil**: you can add coriander, cross out tomatoes and reorder items.

A **tuple** is your **train ticket**: coach, seat and berth like \`("B4", 32, "Lower")\`. Once printed it cannot be edited; you need a new ticket to change it, which is exactly why it can be trusted.

**Indexing** is like numbering coaches from 0, with \`-1\` meaning the last coach.`,
          hi: `**लिस्ट** = सब्ज़ी की सूची जो आप **पेंसिल** से लिखते हैं। धनिया जोड़ दिया, टमाटर काट दिया, क्रम भी बदल दिया — सब कुछ बदला जा सकता है।

**टपल** = आपका **ट्रेन टिकट** — कोच, सीट, बर्थ: \`("B4", 32, "Lower")\`। एक बार छप गया तो बदला नहीं जा सकता; बदलना है तो **नया टिकट** बनवाइए।

**इंडेक्स** = डिब्बों की गिनती 0 से, और \`-1\` मतलब आखिरी डिब्बा।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `60 students ke marks rakhne hain. Bina list ke: \`m1, m2, m3 ... m60\` — 60 variables! Average nikalna, sort karna, topper dhoondhna — sab nightmare.

List ke saath: \`marks = [...]\`, phir \`sum(marks) / len(marks)\`, \`max(marks)\`, \`sorted(marks)\`. Ek naam, poora data.

Tuple kyun alag se? Kyunki kuch data **badalna hi nahi chahiye**:
- Date of birth \`(2004, 8, 15)\`, GPS point \`(lat, lng)\` — galti se change ho jaaye toh bug.
- Tuple **hashable** hai, isliye dict ki key ban sakta hai: \`distance[("Delhi", "Agra")] = 233\`. List nahi ban sakti.
- Function se multiple values return karni ho toh Python tuple hi deta hai.`,
          en: `Storing 60 students' marks without a list means 60 variables. With a list you write \`sum(marks) / len(marks)\`, \`max(marks)\` and \`sorted(marks)\` on one name.

Tuples exist because some data **should never change**:
- A date of birth \`(2004, 8, 15)\` or a GPS point \`(lat, lng)\` must not be edited by accident.
- Tuples are **hashable**, so they can be dict keys: \`distance[("Delhi", "Agra")] = 233\`. Lists cannot.
- Returning multiple values from a function gives you a tuple.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Lists aur tuples har jagah hain — bas naam alag hota hai:

- **Instagram feed / Swiggy cart** — screen pe jo ordered items dikhte hain (posts, cart items), backend ke Python code mein wo aksar list-jaisi ordered collection ke roop mein aate-jaate hain, aur JSON array ban ke app tak pahunchte hain.
- **Google Maps / Ola / Uber jaise maps apps** — ek location \`(latitude, longitude)\` ka joda hai. Python code mein isse tuple mein rakhna natural hai, aur ek route = points ki list.
- **Database drivers** — Python ke standard DB-API (jaise \`sqlite3\`, \`psycopg2\`) mein \`cursor.fetchall()\` rows ki **list of tuples** return karta hai: \`[(1, "Asha"), (2, "Ravi")]\`.`,
          en: `Lists and tuples are everywhere:

- **Feeds and carts** (Instagram, Swiggy) are ordered collections; backend Python code handles them as lists that become JSON arrays for the app.
- **Maps apps** like Google Maps, Ola and Uber deal in \`(latitude, longitude)\` pairs, naturally tuples, and a route is a list of points.
- **Database drivers** following Python's DB-API, such as \`sqlite3\` and \`psycopg2\`, return rows from \`fetchall()\` as a **list of tuples**.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Python list andar se ek **dynamic array** hai — memory mein lagatar slots, aur har slot mein object ka **reference** (pointer), value nahi.

- **Index access \`a[i]\` O(1)** — address = start + i × slot size. Seedha jump.
- **\`append\` amortized O(1)** — list thoda **extra capacity** pehle se rakhti hai. Jagah khatam? Badi memory allocate, purane pointers copy, phir add. Ye copy kabhi-kabhi hoti hai, isliye average fast.
- **\`insert(0, x)\` / \`pop(0)\` O(n)** — baaki sab items ko ek slot khiskana padta hai.
- **\`x in a\` O(n)** — ek-ek karke compare.

**Tuple** fixed size hota hai, extra capacity nahi — thoda kam memory, aur immutable. Par dhyaan: tuple ke andar list ho toh wo list badal sakti hai; tuple sirf references ko lock karta hai.`,
          en: `A Python list is a **dynamic array** of object **references** stored in contiguous slots.

- **\`a[i]\` is O(1)**: the address is computed directly.
- **\`append\` is amortized O(1)**: spare capacity is kept; when full, a bigger block is allocated and pointers are copied, which happens rarely.
- **\`insert(0, x)\` and \`pop(0)\` are O(n)** because every item shifts.
- **\`x in a\` is O(n)**, a linear scan.

A **tuple** has a fixed size with no spare capacity, so it is slightly smaller. It locks references only: a list inside a tuple can still change.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Code walkthrough:

- \`marks\` list pe \`append\`, \`sort\` (list khud badalti hai, return \`None\`), aur \`sorted\` (nayi list deta hai).
- **Slicing:** \`marks[:3]\` top 3, \`marks[-1]\` sabse kam, \`marks[::-1]\` ulta.
- **Tuple unpacking:** \`name, coach, seat = ticket\` — ek line mein teen variables.
- **Aliasing vs copy:** \`alias = marks\` same list hai; \`copy = marks[:]\` alag list. Ek mein change, dusre pe asar dekho.
- **List of tuples ko sort by key:** \`key=lambda item: item[1]\` — price ke hisaab se.

JS mein array same kaam karta hai; tuple JS mein nahi hota, toh fixed record ke liye chhota array ya \`Object.freeze\` use hota hai.`,
          en: `Walkthrough:

- \`append\`, \`sort\` (in place, returns \`None\`) and \`sorted\` (returns a new list).
- **Slicing**: \`marks[:3]\`, \`marks[-1]\` and \`marks[::-1]\`.
- **Tuple unpacking**: \`name, coach, seat = ticket\`.
- **Aliasing vs copying**: \`alias = marks\` is the same list; \`marks[:]\` is a new one.
- **Sorting a list of tuples by a key** such as price.

JavaScript has arrays but no tuples; small arrays or \`Object.freeze\` stand in for fixed records.`,
        },
        codeJs: `const marks = [72, 95, 88, 64];
marks.push(81);
marks.sort((a, b) => b - a);
console.log("Sorted:", marks);
console.log("Top 3:", marks.slice(0, 3), "Lowest:", marks[marks.length - 1], "Reversed:", [...marks].reverse());

const ticket = Object.freeze(["Asha", "B4", 32]);
const [name, coach, seat] = ticket;
console.log(name, "is in", coach, "seat", seat);

const alias = marks;
const copy = [...marks];
alias.push(50);
console.log("marks:", marks.length, "alias:", alias.length, "copy:", copy.length);

const menu = [["Dosa", 120], ["Chai", 20], ["Thali", 180]];
const byPrice = [...menu].sort((a, b) => a[1] - b[1]);
console.log("Cheapest first:", JSON.stringify(byPrice));
console.log("Original untouched:", menu[0]);`,
        codePython: `marks = [72, 95, 88, 64]
marks.append(81)
marks.sort(reverse=True)
print("Sorted:", marks)
print("Top 3:", marks[:3], "Lowest:", marks[-1], "Reversed:", marks[::-1])

ticket = ("Asha", "B4", 32)
name, coach, seat = ticket
print(name, "is in", coach, "seat", seat)

alias = marks
copy = marks[:]
alias.append(50)
print("marks:", len(marks), "alias:", len(alias), "copy:", len(copy))

menu = [("Dosa", 120), ("Chai", 20), ("Thali", 180)]
by_price = sorted(menu, key=lambda item: item[1])
print("Cheapest first:", by_price)
print("Original untouched:", menu[0])`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **\`b = a\` ko copy samajhna.** Dono ek hi list hain! Copy chahiye toh \`a[:]\`, \`list(a)\` ya \`a.copy()\`. (Nested list hai toh \`copy.deepcopy\`.)
2. **\`nums = nums.sort()\`** — \`sort()\` \`None\` return karta hai, ab \`nums\` None ho gaya. Ya toh \`nums.sort()\` akela, ya \`nums = sorted(nums)\`.
3. **Ek item wala tuple:** \`(5)\` sirf number 5 hai! Tuple ke liye comma: \`(5,)\`.
4. **\`IndexError\`** — 5 items wali list mein \`a[5]\` nahi hota, aakhri index 4 hai.
5. **Loop mein list se remove karna** — items skip ho jaate hain. Comprehension se nayi list banao: \`[x for x in a if x > 0]\`.
6. **\`[[0] * 3] * 3\`** — teen rows same list share karti hain! Use \`[[0] * 3 for _ in range(3)]\`.`,
          en: `1. **Treating \`b = a\` as a copy**: both names share one list. Use \`a[:]\`, \`list(a)\` or \`a.copy()\` (or \`deepcopy\` for nested lists).
2. **\`nums = nums.sort()\`** sets \`nums\` to \`None\`.
3. **\`(5)\` is not a tuple**; write \`(5,)\`.
4. **\`IndexError\`** from using \`a[len(a)]\`.
5. **Removing items while looping** skips elements; build a new list instead.
6. **\`[[0] * 3] * 3\`** makes three references to one row; use a comprehension.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `List ki ajeeb problems ke liye:

- **"Maine sirf ek list badli, dusri bhi badal gayi!"** → aliasing. \`print(a is b)\` ya \`id(a), id(b)\` check karo. Same id = same list.
- **\`IndexError: list index out of range\`** → \`print(len(a), i)\` karo. Aksar loop \`range(len(a) + 1)\` ya \`a[len(a)]\` jaisi off-by-one galti hoti hai.
- **\`AttributeError: 'NoneType' object has no attribute 'append'\`** → kahin \`x = x.sort()\` ya \`x = x.append(...)\` likha hai.
- **\`TypeError: 'tuple' object does not support item assignment\`** → tuple badalne ki koshish. List mein convert karo ya naya tuple banao.
- Badi nested list samajh nahi aa rahi? \`from pprint import pprint; pprint(data)\` — saaf formatting.`,
          en: `For confusing list problems:

- **One list changed and another changed too** means aliasing: check \`a is b\`.
- **\`IndexError\`**: print \`len(a)\` and the index; look for off-by-one loops.
- **\`'NoneType' object has no attribute 'append'\`**: you wrote \`x = x.sort()\` or similar.
- **\`'tuple' object does not support item assignment\`**: tuples are immutable; convert or rebuild.
- Use \`pprint\` to read large nested lists.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `List har kaam ke liye best nahi:

- **Baar-baar "ye item hai kya?" check karna** (\`x in big_list\`) O(n) hai → **set** use karo, O(1).
- **Aage se add/remove** (queue jaisa) → \`list.pop(0)\` O(n) hai → \`collections.deque\` use karo, \`popleft()\` O(1).
- **Key se dhoondhna** (roll number → student) → **dict**.
- **Lakhon numbers pe maths** → **NumPy array** — compact memory aur fast.
- **List vs tuple:** data badalna hai → list. Fixed record, dict key, ya "isse koi na chhede" → tuple.

Default soch: ordered + badalna hai → list. Baaki cases mein upar wale tools yaad rakho.`,
          en: `Lists are not always the right tool:

- **Frequent membership checks** are O(n) on a list; use a **set** for O(1).
- **Queue-like removal from the front** is O(n) with \`pop(0)\`; use \`collections.deque\`.
- **Lookup by key** belongs in a **dict**.
- **Heavy numeric work** fits **NumPy arrays**.
- **List vs tuple**: changing data uses a list; fixed records and dict keys use a tuple.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Restaurant dashboard ka ek chhota feature: "aaj ke top 3 selling items".

\`\`\`python
sales = [("Dosa", 140), ("Chai", 320), ("Thali", 75), ("Vada", 210)]
top3 = sorted(sales, key=lambda row: row[1], reverse=True)[:3]
for rank, (item, qty) in enumerate(top3, start=1):
    print(rank, item, qty)
\`\`\`

Har row ek **tuple** hai — \`(item, qty)\` — kyunki ek record ke andar ka structure fix hai. Saari rows ek **list** mein hain kyunki din bhar nayi sales judti hain. \`sorted\` original data ko nahi chhedta, toh baaki dashboard same \`sales\` ko safely use kar sakta hai. Database se data aaye toh bhi yahi shape milegi — list of tuples.`,
          en: `A restaurant dashboard showing "today's top 3 items":

\`\`\`python
sales = [("Dosa", 140), ("Chai", 320), ("Thali", 75), ("Vada", 210)]
top3 = sorted(sales, key=lambda row: row[1], reverse=True)[:3]
for rank, (item, qty) in enumerate(top3, start=1):
    print(rank, item, qty)
\`\`\`

Each row is a **tuple** because a record's shape is fixed; the rows live in a **list** because new sales keep arriving. \`sorted\` leaves the original untouched, and database drivers return exactly this list-of-tuples shape.`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "What happens inside a list when you append",
      steps: [
        {
          title: "Start",
          description: "a = [7, 3]. Python allocated 4 slots (capacity 4) but only 2 are used. Each slot holds a reference to an int object.",
          highlight: "size 2 / capacity 4",
        },
        {
          title: "append(9)",
          description: "There is a free slot, so the reference is placed in slot 2. Cost: O(1).",
          highlight: "[7, 3, 9, _]",
        },
        {
          title: "append(5)",
          description: "Slot 3 is free too. Still O(1).",
          highlight: "[7, 3, 9, 5] size 4 / capacity 4",
        },
        {
          title: "append(1) when full",
          description: "No free slot. Python allocates a bigger block (roughly 1.125x plus a little), copies the 4 references over, then adds 1. This one append costs O(n).",
          highlight: "resize + copy",
        },
        {
          title: "Amortized O(1)",
          description: "Resizes are rare and capacity grows proportionally, so the average cost per append stays constant. insert(0, x) is different: it always shifts every item, O(n).",
          highlight: "average append = O(1)",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which of these is immutable?",
        options: ["list", "tuple", "dict", "set"],
        correct: [1],
        explanation: "Tuple ek baar bana toh badal nahi sakta. List, dict aur set mutable hain.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `nums.sort()` return?",
        options: ["A new sorted list", "The same list, sorted", "None", "True if sorting succeeded"],
        correct: [2],
        explanation: "`sort()` list ko in-place badalta hai aur `None` return karta hai. Nayi sorted list chahiye toh `sorted(nums)`.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "How do you write a tuple containing just the number 5?",
        options: ["(5)", "(5,)", "[5]", "tuple 5"],
        correct: [1],
        explanation: "`(5)` sirf brackets mein 5 hai. Comma hi tuple banata hai: `(5,)`.",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which operations on a Python list are O(1) on average?",
        options: ["append(x)", "a[i]", "insert(0, x)", "pop() from the end"],
        correct: [0, 1, 3],
        explanation: "Append (amortized), index access aur end se pop O(1) hain. `insert(0, x)` sab items khiskata hai — O(n).",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `a = [1, 2, 3]
b = a
b.append(4)
print(a, len(b))`,
        codeLanguage: "python",
        options: ["[1, 2, 3] 4", "[1, 2, 3, 4] 4", "[1, 2, 3] 3", "[1, 2, 3, 4] 3"],
        correct: [1],
        explanation: "`b = a` copy nahi banata — dono ek hi list ko point karte hain. `b.append(4)` se `a` bhi badal gaya.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `nums = [10, 20, 30, 40, 50]
print(nums[1:4], nums[-2:], nums[::2])`,
        codeLanguage: "python",
        options: [
          "[20, 30, 40] [40, 50] [10, 30, 50]",
          "[20, 30, 40, 50] [40, 50] [10, 30, 50]",
          "[10, 20, 30] [50] [20, 40]",
          "[20, 30, 40] [50, 40] [10, 30, 50]",
        ],
        correct: [0],
        explanation: "`[1:4]` index 1 se 3 tak (4 exclude). `[-2:]` aakhri do. `[::2]` har dusra item, index 0 se.",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "You want to cache distances between city pairs in a dict, like distance[(\"Delhi\", \"Agra\")] = 233. Which type should the key be?",
        options: [
          "A list [\"Delhi\", \"Agra\"]",
          "A tuple (\"Delhi\", \"Agra\")",
          "A set {\"Delhi\", \"Agra\"}",
          "Any type works as a key",
        ],
        correct: [1],
        explanation: "Dict key hashable honi chahiye. Tuple immutable hai isliye hashable; list nahi. String jod ke bhi kaam chalega par tuple saaf aur galti-proof hai.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 3,
        prompt: "Order what CPython does when you append to a list that is already full.",
        options: [
          "Check that size has reached capacity",
          "Allocate a larger block of memory",
          "Copy the existing references into the new block",
          "Store the new item and increase the size",
        ],
        explanation: "Capacity check → bada block allocate → purane references copy → naya item add → size update.",
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "When would you use a tuple instead of a list? Give two reasons.",
        keywords: ["immutable", "hashable", "fixed", "dict key"],
        explanation: "Tuple immutable hai — fixed record (date, GPS point) galti se nahi badlega. Hashable hai — dict key ya set member ban sakta hai. Thoda kam memory bhi leta hai. List tab jab data badalna ho.",
      },
    ],
    buildTask: {
      title: "Merge two sorted lists",
      description: `Do **sorted** lists di gayi hain (chhote se bade). Function \`mergeSortedLists(a, b)\` likho jo dono ko mila ke ek **sorted list** return kare.

- Duplicates rakhne hain (\`[1, 1]\` + \`[1]\` → \`[1, 1, 1]\`).
- Koi list empty bhi ho sakti hai.
- Bonus challenge: built-in \`sort\` mat use karo — do pointers (do index) se ek baar mein merge karo. Ye merge sort ka core step hai!

Example: \`mergeSortedLists([1, 3, 5], [2, 4, 6])\` → \`[1, 2, 3, 4, 5, 6]\``,
      functionName: "mergeSortedLists",
      starterJs: `function mergeSortedLists(a, b) {
  const result = [];
  let i = 0;
  let j = 0;
  // TODO: compare a[i] and b[j], push the smaller one
  return result;
}`,
      starterPython: `def mergeSortedLists(a, b):
    result = []
    i, j = 0, 0
    # TODO: compare a[i] and b[j], append the smaller one
    return result`,
      tests: [
        {
          name: "interleaved",
          args: [
            [1, 3, 5],
            [2, 4, 6],
          ],
          expected: [1, 2, 3, 4, 5, 6],
        },
        {
          name: "first list empty",
          args: [
            [],
            [1, 2],
          ],
          expected: [1, 2],
        },
        {
          name: "duplicates are kept",
          args: [
            [1, 1, 2],
            [1, 3],
          ],
          expected: [1, 1, 1, 2, 3],
        },
        {
          name: "negative numbers",
          args: [
            [-5, 0],
            [-3, 10],
          ],
          expected: [-5, -3, 0, 10],
        },
        {
          name: "both empty",
          args: [
            [],
            [],
          ],
          expected: [],
        },
        {
          name: "second list empty",
          args: [
            [1, 2, 3],
            [],
          ],
          expected: [1, 2, 3],
          hidden: true,
        },
        {
          name: "one list much longer",
          args: [
            [5],
            [1, 2, 3, 4],
          ],
          expected: [1, 2, 3, 4, 5],
          hidden: true,
        },
      ],
      hints: [
        "Dono lists already sorted hain. Har step pe dono ke 'current' items mein se jo chhota hai wahi result mein jaayega.",
        "Step 1: i = 0, j = 0. Step 2: jab tak i < len(a) aur j < len(b), chhota wala append karo aur uska index badhao. Step 3: jo list bachi hai uske remaining items end mein jod do.",
        `while i < len(a) and j < len(b):
    if a[i] <= b[j]:
        result.append(a[i]); i += 1
    else:
        result.append(b[j]); j += 1
# then add a[i:] and b[j:]`,
      ],
      explainQuestions: [
        {
          question: "What happens after one list runs out of items?",
          keywords: ["remaining", "append rest", "other list", "slice"],
        },
        {
          question: "What is the time complexity of your merge for lists of size n and m?",
          keywords: ["o(n + m)", "linear", "each element once"],
        },
        {
          question: "Why did you use <= instead of < when comparing?",
          keywords: ["duplicates", "equal", "stable"],
        },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "What is the difference between a list and a tuple in Python?",
        short: "Both are ordered sequences. Lists are mutable, so you can append, remove and reassign items; tuples are immutable. Because tuples cannot change, they are hashable when their items are hashable, so they can be dict keys or set members, and they use slightly less memory. Use lists for collections that change and tuples for fixed records.",
        deep: `- **list**: mutable, not hashable, used for growing collections.
- **tuple**: immutable, hashable if its items are, used for fixed records, dict keys and multiple return values.
- A tuple holding a list is not hashable, and the inner list can still change.
- Tuple literals can be constant-folded by CPython, which makes them a little cheaper to create.`,
        followUps: [
          "Can a tuple ever change?",
          "Why can't a list be a dict key?",
          "What does a function return when you write `return a, b`?",
        ],
        commonMistake: "Saying tuples are 'faster lists'. The main difference is mutability and hashability, not speed.",
        keywords: ["mutable", "immutable", "hashable", "dict key", "fixed record"],
        difficulty: 1,
        roles: ["SDE", "BACKEND", "AI"],
      },
      {
        question: "Why is list.append amortized O(1) while list.insert(0, x) is O(n)?",
        short: "A Python list is a dynamic array with spare capacity. Appending usually writes into a free slot at the end, and when the array is full it grows proportionally, so the occasional copy is spread across many appends. Inserting at the front has to shift every existing element one position, which always costs O(n).",
        deep: `- Growth is proportional (geometric), so the total copy work for n appends is O(n), i.e. O(1) each on average.
- \`pop()\` from the end is O(1); \`pop(0)\` is O(n).
- For queue behaviour use \`collections.deque\`, which has O(1) \`appendleft\` and \`popleft\`.`,
        followUps: [
          "What does amortized mean?",
          "How would you implement a queue efficiently in Python?",
          "What is the cost of `x in my_list`?",
        ],
        commonMistake: "Claiming every append is O(1) worst case. Individual appends that trigger a resize are O(n).",
        keywords: ["dynamic array", "capacity", "resize", "shift elements", "deque"],
        difficulty: 2,
        roles: ["SDE", "BACKEND"],
      },
    ],
  },
  {
    slug: "py-sets-dicts",
    estMinutes: 45,
    difficulty: 2,
    prerequisites: ["py-lists-tuples"],
    objectives: [
      "Create and update dictionaries, and read values safely with get()",
      "Use sets to remove duplicates and test membership quickly",
      "Explain why dict and set lookups are O(1) on average (hash tables) and why keys must be hashable",
      "Count frequencies and group data with dicts",
    ],
    technicalDefinition: "A dict is a hash-table-backed mapping from hashable keys to values that preserves insertion order (Python 3.7+); a set is an unordered hash-table-backed collection of unique hashable elements; both give average O(1) insert, delete and membership tests.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Dictionary (dict)** key → value ka joda rakhta hai. List mein item number (index) se dhoondhte ho; dict mein **naam (key) se**:

\`\`\`python
menu = {"chai": 20, "samosa": 15}
menu["chai"]        # 20
menu["vada"] = 25   # naya item add
\`\`\`

**Set** sirf unique values ka collection hai — duplicate apne aap hat jaate hain, order ki guarantee nahi:

\`\`\`python
tags = {"python", "dsa", "python"}   # {"python", "dsa"}
\`\`\`

Dono ki superpower: **"ye key/item hai kya?" ka jawab turant** (average O(1)), chahe 10 items ho ya 1 crore.`,
          en: `A **dictionary (dict)** stores key → value pairs. A list is searched by position; a dict is searched **by key**, e.g. \`menu["chai"]\` gives 20 and \`menu["vada"] = 25\` adds an item.

A **set** is a collection of unique values: duplicates disappear automatically and there is no guaranteed order.

Both answer "is this key or item present?" **almost instantly** (average O(1)), whether they hold 10 items or 1 crore.`,
          hi: `**डिक्शनरी (dict)** key → value के जोड़े रखती है। लिस्ट में स्थान (इंडेक्स) से खोजते हैं, dict में **नाम (key) से**: \`menu["chai"]\` से 20 मिलता है।

**सेट** सिर्फ़ अलग-अलग (unique) वैल्यू का संग्रह है — डुप्लिकेट अपने आप हट जाते हैं और क्रम की कोई गारंटी नहीं।

दोनों की खासियत: **"क्या यह key/आइटम मौजूद है?" का जवाब तुरंत** (औसतन O(1)), चाहे 10 आइटम हों या 1 करोड़।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Dict = phone ke contacts.** Tum "Mummy" search karte ho, number turant mil jaata hai. Tumhe ye yaad nahi rakhna ki Mummy contact list mein 47th number pe hai — naam hi key hai. Ek naam ka ek hi entry; dobara save karoge toh purana number overwrite.

**Set = shaadi ke gate pe guest list.** Har mehmaan ka naam list mein **ek hi baar**. Gate wala bhaiya check karta hai "naam list mein hai?" — haan ya na, bas. Kaun pehle aaya, kaun baad mein — order se matlab nahi.

Aur dono fast kyun hain? Socho contacts ko A–Z ke alag-alag khaanon mein baanta gaya hai. "Mummy" seedha **M wale khaane** mein milega — poori diary palatne ki zaroorat nahi. Yahi idea **hashing** hai.`,
          en: `**A dict is your phone's contact list.** You search "Mom" and get the number immediately without remembering her position; the name is the key. Saving the same name again overwrites the old number.

**A set is the guest list at a wedding gate.** Each name appears once, and the guard only asks "is this name on the list?", not who came first.

Both are fast because entries are filed into compartments, like contacts sorted into A–Z drawers: "Mom" is found straight in the M drawer. That idea is **hashing**.`,
          hi: `**Dict = फ़ोन के कॉन्टैक्ट्स।** आप "मम्मी" खोजते हैं और नंबर तुरंत मिल जाता है — नाम ही key है। एक नाम की एक ही एंट्री; दोबारा सेव करेंगे तो पुराना नंबर बदल जाएगा।

**सेट = शादी के गेट पर मेहमानों की सूची।** हर नाम **एक ही बार**। गेट वाले भैया सिर्फ़ देखते हैं "नाम सूची में है?" — क्रम से कोई मतलब नहीं।

दोनों तेज़ क्यों हैं? मानो कॉन्टैक्ट्स A–Z के अलग खानों में बँटे हैं — "मम्मी" सीधे M वाले खाने में मिलेगी। यही **हैशिंग** का विचार है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Socho 10 lakh users ke usernames ek **list** mein hain. Naya user "rahul_07" signup kar raha hai — "ye naam pehle se liya hai?" check karne ke liye list mein ek-ek karke 10 lakh comparisons. Har signup pe! App slow.

**Set** mein yahi check ek jhatke mein — average O(1).

Dict ki zaroorat tab hai jab data ko **naam se** access karna ho:
- Roll number → student details
- Product ID → price
- Word → kitni baar aaya (frequency count)

List mein ye karne ke liye har baar search karna padta. Isliye real backend code mein dict sabse zyada use hone wala data structure hai — JSON bhi Python mein aate hi dict ban jaata hai.`,
          en: `With 10 lakh usernames in a **list**, checking whether "rahul_07" is taken needs up to 10 lakh comparisons on every signup. A **set** does it in average O(1).

A dict is needed whenever you access data **by name**:
- roll number → student details
- product ID → price
- word → count

With a list you would search every time. That is why dicts are the most used structure in backend Python, and why JSON becomes a dict as soon as it is parsed.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Har JSON API** — GitHub, Razorpay, ya koi bhi REST API ka JSON response Python mein \`json.loads()\` ya \`response.json()\` se seedha **dict** ban jaata hai. Backend developer ka aadha din dicts padhne-likhne mein jaata hai.
- **Redis** — bahut saari companies (Twitter, GitHub, Stack Overflow jaisi) caching ke liye Redis use karti hain. Redis ek key-value store hai — concept bilkul dict jaisa, bas alag server pe aur bahut fast.
- **Python khud** — Python ke andar objects ke attributes, modules ke global variables, sab internally dicts mein rakhe jaate hain (\`obj.__dict__\`). Isliye CPython team ne dict ko bahut optimise kiya hai.`,
          en: `- **Every JSON API**: a response from GitHub, Razorpay or any REST API becomes a **dict** via \`json.loads()\` or \`response.json()\`.
- **Redis**, used for caching by companies like Twitter, GitHub and Stack Overflow, is a key-value store: the same idea as a dict, on a separate fast server.
- **Python itself** stores object attributes and module globals in dicts (\`obj.__dict__\`), which is why CPython's dict is heavily optimised.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Dict aur set dono **hash table** hain.

1. \`menu["chai"] = 20\` pe Python \`hash("chai")\` nikalta hai — ek bada integer.
2. Us number se table ka **slot index** banta hai (hash ko table size ke hisaab se chhota karke).
3. Slot khaali → key aur value wahan rakh do. Slot bhara hai (**collision**) → CPython **open addressing** use karta hai: ek fixed formula se agla slot try karta hai.
4. Lookup pe same hash → same slot → key compare (\`==\`) → value mili.

Table **2/3 bhar** jaaye toh bada table banta hai aur sab entries dobara rakhi jaati hain (resize). Isliye average O(1), par kabhi-kabhi ek operation slow.

**Key hashable kyun?** Agar list key hoti aur baad mein badal jaati, uska hash badal jaata — entry galat slot mein kho jaati. Isliye sirf immutable types (str, int, tuple) keys ban sakte hain. Python 3.7+ mein dict **insertion order** yaad rakhta hai.`,
          en: `Dicts and sets are **hash tables**.

1. \`menu["chai"] = 20\` computes \`hash("chai")\`.
2. The hash is reduced to a **slot index** in the table.
3. An empty slot stores the entry; on a **collision** CPython uses **open addressing**, probing other slots by a fixed formula.
4. A lookup repeats the same hash, finds the slot, compares keys with \`==\` and returns the value.

When the table is about two-thirds full it is resized and entries are reinserted, so operations are O(1) on average. Keys must be **hashable** (immutable) because a changed key would sit in the wrong slot. Dicts keep insertion order since Python 3.7.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Code mein:

- **Word frequency:** \`counts[w] = counts.get(w, 0) + 1\` — key nahi hai toh 0 se shuru. Ye pattern interview mein bahut aata hai.
- **Safe read:** \`menu.get("vada", "not available")\` — KeyError ki jagah default.
- **Loop:** \`for item, price in menu.items()\` — key aur value dono.
- **Set ops:** \`&\` common (intersection), \`|\` sab (union), \`-\` sirf pehle mein (difference). Set ka order fix nahi, isliye print se pehle \`sorted()\` kiya — output hamesha same.
- **Dedupe:** \`set(emails)\` duplicates hatata hai.

JS mein \`Map\` aur \`Set\` same kaam karte hain; JSON jaisa data plain object \`{}\` mein bhi rakhte hain.`,
          en: `In the code:

- **Word frequency** with \`counts[w] = counts.get(w, 0) + 1\`, a very common interview pattern.
- **Safe reads** with \`get\` and a default instead of a KeyError.
- **Looping** over \`.items()\` for keys and values.
- **Set operations**: \`&\` intersection, \`|\` union, \`-\` difference. Sets are unordered, so results are wrapped in \`sorted()\` for stable output.
- **Deduplication** with \`set(emails)\`.

JavaScript uses \`Map\` and \`Set\`, or plain objects for JSON-like data.`,
        },
        codeJs: `const text = "chai samosa chai jalebi chai samosa";
const counts = new Map();
for (const w of text.split(" ")) {
  counts.set(w, (counts.get(w) || 0) + 1);
}
console.log(Object.fromEntries(counts));

const menu = { chai: 20, samosa: 15 };
console.log(menu.vada ?? "not available");
for (const [item, price] of Object.entries(menu)) {
  console.log(item, "costs", price);
}

const pythonBatch = new Set(["asha", "ravi", "meena", "john"]);
const dsaBatch = new Set(["ravi", "john", "kiran"]);
const both = [...pythonBatch].filter((x) => dsaBatch.has(x)).sort();
const either = [...new Set([...pythonBatch, ...dsaBatch])].sort();
const onlyPython = [...pythonBatch].filter((x) => !dsaBatch.has(x)).sort();
console.log("Both:", both);
console.log("Either:", either);
console.log("Only Python:", onlyPython);

const emails = ["a@x.com", "b@x.com", "a@x.com"];
console.log("Unique emails:", new Set(emails).size);`,
        codePython: `text = "chai samosa chai jalebi chai samosa"
counts = {}
for w in text.split():
    counts[w] = counts.get(w, 0) + 1
print(counts)

menu = {"chai": 20, "samosa": 15}
print(menu.get("vada", "not available"))
for item, price in menu.items():
    print(item, "costs", price)

python_batch = {"asha", "ravi", "meena", "john"}
dsa_batch = {"ravi", "john", "kiran"}
print("Both:", sorted(python_batch & dsa_batch))
print("Either:", sorted(python_batch | dsa_batch))
print("Only Python:", sorted(python_batch - dsa_batch))

emails = ["a@x.com", "b@x.com", "a@x.com"]
print("Unique emails:", len(set(emails)))`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **\`d["key"]\` jab key ho hi na** → \`KeyError\`. Pakka nahi pata toh \`d.get("key")\` ya \`if "key" in d\`.
2. **\`{}\` ko empty set samajhna.** \`{}\` empty **dict** hai! Empty set: \`set()\`.
3. **List ko key banana** → \`TypeError: unhashable type: 'list'\`. Tuple use karo.
4. **Set mein order expect karna.** \`{3, 1, 2}\` print karne pe order guarantee nahi — sorted chahiye toh \`sorted(s)\`.
5. **Loop mein dict ka size badalna** → \`RuntimeError: dictionary changed size during iteration\`. \`for k in list(d):\` pe loop chalao.
6. **\`"1"\` aur \`1\` alag keys hain.** JSON se aaye IDs aksar strings hote hain — type match karo.`,
          en: `1. **Reading a missing key** with \`d["key"]\` raises \`KeyError\`; use \`get\` or check with \`in\`.
2. **\`{}\` is an empty dict**, not a set; use \`set()\`.
3. **Lists as keys** raise \`unhashable type: 'list'\`; use tuples.
4. **Expecting set order**; use \`sorted(s)\`.
5. **Changing a dict's size while looping** raises a RuntimeError; loop over \`list(d)\`.
6. **\`"1"\` and \`1\` are different keys**; IDs from JSON are often strings.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `- **\`KeyError: 'Chai'\`** → error message mein jo key hai use dekho. Aksar case (\`Chai\` vs \`chai\`), extra space (\`"chai "\`), ya type (\`"1"\` vs \`1\`) ka chakkar hota hai. \`print(list(d.keys()))\` karke asli keys dekho.
- **\`print(repr(key))\`** — \`repr\` extra spaces aur quotes dikhata hai, normal print nahi.
- **Bada nested JSON?** \`import json; print(json.dumps(data, indent=2))\` — saaf, indented view milega.
- **Count galat aa raha hai?** Check karo ki words normalise hue ya nahi — \`lower()\`, \`strip()\`. "Chai" aur "chai" do alag keys ban jaati hain.
- **Set mein item "missing"?** Shayad wo mutable/changed object hai, ya type alag hai (\`1\` vs \`1.0\` same maane jaate hain, \`"1"\` nahi).`,
          en: `- **\`KeyError\`**: inspect the key in the message; case, stray spaces and types (\`"1"\` vs \`1\`) are the usual culprits. Print \`list(d.keys())\`.
- **Use \`repr(key)\`** to reveal hidden spaces.
- **Large nested JSON**: \`json.dumps(data, indent=2)\` gives a readable view.
- **Wrong counts** often mean words were not normalised with \`lower()\` and \`strip()\`.
- **An item "missing" from a set** may have a different type; \`1\` and \`1.0\` are equal but \`"1"\` is not.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Dict/set bahut fast hain, par free nahi:

- **Memory zyada** — hash table khaali slots bhi rakhta hai. Chhoti fixed list (5 items) ke liye list bhi theek hai.
- **Order by value / sorted keys** chahiye? Dict sorted nahi rakhta — har baar \`sorted()\` lagana padega. Hamesha sorted data chahiye toh sorted list + \`bisect\`, ya specialised libraries.
- **Counting ke liye** \`collections.Counter\` aur grouping ke liye \`defaultdict(list)\` — kam code, kam bugs.
- **Structure fix hai** (har user ke paas name, age, email)? Dict mein typo-wali keys (\`"emial"\`) pakdi nahi jaati — \`dataclass\` ya Pydantic model better hai.`,
          en: `Dicts and sets are fast but not free:

- **More memory**, because hash tables keep empty slots. A tiny fixed list is fine for 5 items.
- **No sorting**: you must call \`sorted()\` each time, or keep a sorted list with \`bisect\`.
- **\`collections.Counter\`** for counting and **\`defaultdict(list)\`** for grouping mean less code.
- **Fixed structures** like a user record are safer as a \`dataclass\` or Pydantic model, where key typos are caught.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek analytics script: "kis city se kitne orders aaye, aur kaun-kaun se unique customers the?"

\`\`\`python
orders = [
    {"id": 1, "city": "Pune", "user": "u1"},
    {"id": 2, "city": "Delhi", "user": "u2"},
    {"id": 3, "city": "Pune", "user": "u1"},
]
per_city = {}
customers = set()
for o in orders:
    per_city[o["city"]] = per_city.get(o["city"], 0) + 1
    customers.add(o["user"])
\`\`\`

Har order khud ek **dict** hai (JSON se aaya). Counting ke liye dict, unique users ke liye **set** — ek hi loop, O(n). Agar tum ye list ke saath karte (har user ke liye "pehle aaya?" check), toh O(n²) — 1 lakh orders pe script minutes leti. Yahi fark interview mein bhi poocha jaata hai.`,
          en: `An analytics script: "orders per city, and the set of unique customers".

\`\`\`python
per_city = {}
customers = set()
for o in orders:
    per_city[o["city"]] = per_city.get(o["city"], 0) + 1
    customers.add(o["user"])
\`\`\`

Each order is a **dict** parsed from JSON, counts live in a dict and unique users in a **set**, all in one O(n) loop. Doing the uniqueness check with a list would be O(n²) and painfully slow at 1 lakh orders.`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "Inside a dict: storing and finding \"chai\"",
      steps: [
        {
          title: "Empty table",
          description: "A new dict starts with a small table of empty slots (8 in CPython).",
          highlight: "[_, _, _, _, _, _, _, _]",
        },
        {
          title: "hash(\"chai\")",
          description: "Python computes a big integer hash for the key and reduces it to a slot number, say 5.",
          highlight: "slot 5",
        },
        {
          title: "Store",
          description: "Slot 5 is empty, so (\"chai\", 20) goes there. No other key was compared.",
          highlight: "slot 5 → chai: 20",
        },
        {
          title: "Collision",
          description: "\"vada\" also maps to slot 5. CPython probes another slot using a fixed formula and stores it at slot 2.",
          highlight: "slot 2 → vada: 25",
        },
        {
          title: "Lookup d[\"chai\"]",
          description: "Same hash → slot 5 → key matches with == → return 20. Average O(1), independent of dict size.",
          highlight: "d[\"chai\"] = 20",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `x = {}` create?",
        options: ["An empty set", "An empty dict", "An empty list", "A SyntaxError"],
        correct: [1],
        explanation: "`{}` empty dict hai. Empty set ke liye `set()` likhna padta hai.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which of these CANNOT be used as a dict key?",
        options: ["\"chai\"", "42", "(1, 2)", "[1, 2]"],
        correct: [3],
        explanation: "Key hashable (immutable) honi chahiye. List mutable hai, isliye `TypeError: unhashable type: 'list'`.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "`stock = {\"chai\": 10}`. What does `stock.get(\"vada\", 0)` return?",
        options: ["None", "0", "KeyError", "10"],
        correct: [1],
        explanation: "Key nahi hai toh `get` default value deta hai — yahan 0. KeyError nahi aata.",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which statements about Python sets are true?",
        options: [
          "Duplicates are removed automatically",
          "`x in s` is O(1) on average",
          "You can access items by index like s[0]",
          "Items are always kept in insertion order",
        ],
        correct: [0, 1],
        explanation: "Set duplicates hata deta hai aur membership average O(1) hai. Set mein index nahi hota (`s[0]` error), aur order ki guarantee nahi.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 1,
        prompt: "What does this code print?",
        code: `s = {3, 1, 3, 2, 1}
print(len(s), sorted(s))`,
        codeLanguage: "python",
        options: ["5 [1, 1, 2, 3, 3]", "3 [1, 2, 3]", "3 {1, 2, 3}", "3 [3, 1, 2]"],
        correct: [1],
        explanation: "Set mein 3, 1, 2 hi bache — 3 unique items. `sorted` list return karta hai `[1, 2, 3]`.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `stock = {"chai": 10, "samosa": 5}
stock["chai"] -= 3
stock["vada"] = stock.get("vada", 0) + 4
print(stock)`,
        codeLanguage: "python",
        options: [
          "{'chai': 7, 'samosa': 5, 'vada': 4}",
          "{'chai': 10, 'samosa': 5, 'vada': 4}",
          "KeyError: 'vada'",
          "{'vada': 4, 'chai': 7, 'samosa': 5}",
        ],
        correct: [0],
        explanation: "chai 10 se 7 hua. `vada` nahi tha toh `get` ne 0 diya, +4 = 4, aur naya key end mein add hua (insertion order).",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "During signup you must check whether a username is already taken among 10 lakh existing usernames, many times per second. What should you keep in memory?",
        options: [
          "A list of usernames",
          "A set of usernames",
          "A tuple of usernames",
          "A string with all usernames joined",
        ],
        correct: [1],
        explanation: "Set mein membership check average O(1) hai. List mein O(n) — har signup pe lakhon comparisons. Sorted list + binary search O(log n) chalega, par insert O(n).",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps Python follows for the lookup `d[\"chai\"]`.",
        options: [
          "Compute hash(\"chai\")",
          "Turn the hash into a slot index in the table",
          "Compare the key stored in that slot with \"chai\" (probe further on collision)",
          "Return the value, or raise KeyError if an empty slot is reached",
        ],
        explanation: "Hash → slot → key compare → value return (ya KeyError agar empty slot mila).",
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why are dict lookups O(1) on average but O(n) in the worst case?",
        keywords: ["hash", "slot", "collision", "average", "worst case"],
        explanation: "Hash se seedha slot milta hai, toh size se farak nahi padta — average O(1). Par agar bahut keys same slot pe collide karein (bura hash ya attack), toh probing mein ek-ek key compare hogi — worst case O(n).",
      },
    ],
    buildTask: {
      title: "Word frequency counter",
      description: `Ek chhota analytics tool banao. Function \`wordFrequency(text)\` likho jo ek string le aur **dict** return kare: har word → kitni baar aaya.

- Words **whitespace** se alag hain (ek ya zyada spaces).
- **Case ignore** karo — \`"Chai"\` aur \`"chai"\` same word, key lowercase mein rakho.
- Empty ya sirf spaces wali string → \`{}\`.
- Punctuation ki chinta mat karo (tests mein nahi hai).

Example: \`wordFrequency("chai chai samosa")\` → \`{"chai": 2, "samosa": 1}\``,
      functionName: "wordFrequency",
      starterJs: `function wordFrequency(text) {
  const counts = {};
  // TODO: split on whitespace, lowercase, count
  return counts;
}`,
      starterPython: `def wordFrequency(text):
    counts = {}
    # TODO: split on whitespace, lowercase, count
    return counts`,
      tests: [
        {
          name: "simple repeat",
          args: ["chai chai samosa"],
          expected: {
            chai: 2,
            samosa: 1,
          },
        },
        {
          name: "empty string",
          args: [""],
          expected: {},
        },
        {
          name: "case is ignored",
          args: ["Hello hello HELLO"],
          expected: {
            hello: 3,
          },
        },
        {
          name: "single letters",
          args: ["a b c a"],
          expected: {
            a: 2,
            b: 1,
            c: 1,
          },
        },
        {
          name: "only spaces",
          args: [""],
          expected: {},
        },
        {
          name: "extra spaces everywhere",
          args: ["spaced   out  words"],
          expected: {
            spaced: 1,
            out: 1,
            words: 1,
          },
          hidden: true,
        },
        {
          name: "sentence",
          args: ["Python is fun and python is easy"],
          expected: {
            python: 2,
            is: 2,
            fun: 1,
            and: 1,
            easy: 1,
          },
          hidden: true,
        },
      ],
      hints: [
        "Dict mein word ko key aur count ko value rakho. Naya word mile toh 0 se shuru karo — `get(word, 0)` yahi karta hai.",
        "Step 1: text.lower(). Step 2: split() (Python mein bina argument ke split saare extra spaces sambhal leta hai; JS mein trim + split(/\\s+/) ya filter). Step 3: har word ke liye count badhao.",
        `for word in text.lower().split():
    counts[word] = counts.get(word, 0) + 1`,
      ],
      explainQuestions: [
        {
          question: "How did you handle words that appear for the first time?",
          keywords: ["get", "default", "zero", "in"],
        },
        {
          question: "Why is a dict better than a list for counting words?",
          keywords: ["o(1)", "lookup", "key", "hash"],
        },
        {
          question: "How did you deal with multiple spaces and different letter cases?",
          keywords: ["split", "lower", "whitespace", "empty"],
        },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "How does a Python dict work internally?",
        short: "A dict is a hash table. Python hashes the key, maps the hash to a slot in an array, and stores the key, value and hash there. On lookup it hashes again, goes to the slot and compares keys; collisions are handled with open addressing by probing other slots. The table resizes when it gets about two-thirds full, giving average O(1) operations.",
        deep: `- **Hashable keys**: the key's hash must not change, so keys are immutable types (str, int, tuple of immutables). Objects that are equal must have equal hashes.
- **Collisions**: CPython uses open addressing with a perturbation-based probe sequence.
- **Ordering**: since 3.7 the language guarantees insertion order; CPython stores entries in a compact array plus a sparse index table.
- **Worst case** O(n) when many keys collide; string hashing is randomised per process to resist hash-flooding attacks.`,
        followUps: [
          "What makes an object hashable?",
          "Why did Python randomise string hashes?",
          "What happens when the table resizes?",
        ],
        commonMistake: "Saying dict lookup is always O(1). It is average O(1); collisions make the worst case O(n).",
        keywords: ["hash table", "hashable", "collision", "open addressing", "resize"],
        difficulty: 2,
        roles: ["SDE", "BACKEND", "AI"],
      },
      {
        question: "When would you use a set instead of a list?",
        short: "Use a set when you need uniqueness or fast membership tests and do not care about order or duplicates. `x in set` is O(1) on average versus O(n) for a list. Sets also give union, intersection and difference directly. Keep a list when order, duplicates or index access matter.",
        deep: `- Deduplicate: \`unique = set(items)\`; to keep first-seen order use \`list(dict.fromkeys(items))\`.
- Common elements of two lists: \`set(a) & set(b)\` is O(n + m) instead of O(n * m).
- Sets cost more memory per element than lists.`,
        followUps: [
          "How do you deduplicate while preserving order?",
          "What is a frozenset?",
          "Complexity of finding common elements of two lists?",
        ],
        commonMistake: "Using `if x not in my_list: my_list.append(x)` inside a loop, which makes deduplication O(n²).",
        keywords: ["membership", "o(1)", "unique", "order", "intersection"],
        difficulty: 1,
        roles: ["SDE", "BACKEND"],
      },
    ],
  },
  {
    slug: "big-o",
    estMinutes: 45,
    difficulty: 2,
    prerequisites: [],
    objectives: [
      "Explain Big-O as the growth rate of time or memory as input size n grows",
      "Recognise O(1), O(log n), O(n), O(n log n) and O(n²) in code",
      "Simplify expressions by dropping constants and lower-order terms",
      "Spot hidden costs (like `in` on a list inside a loop) and trade space for time",
    ],
    technicalDefinition: "Big-O notation gives an asymptotic upper bound on how an algorithm's running time or memory grows as a function of input size n, ignoring constant factors and lower-order terms.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Big-O** batata hai ki input bada hone pe tumhara code **kitna slow** (ya kitni memory khaane wala) ho jaayega.

Ye seconds mein nahi naapta — kyunki seconds laptop pe depend karte hain. Ye **growth** naapta hai: n (input size) double hua toh kaam kitna badha?

- **O(1)** — n kuch bhi ho, kaam same. (\`nums[0]\`)
- **O(log n)** — n double, kaam bas ek step zyada. (binary search)
- **O(n)** — n double, kaam double. (ek loop)
- **O(n²)** — n double, kaam **4 guna**. (loop ke andar loop)

Rule: constants hatao (\`O(3n)\` → \`O(n)\`), sabse bada term rakho (\`O(n² + n)\` → \`O(n²)\`).`,
          en: `**Big-O** describes how much slower (or more memory-hungry) code becomes as its input grows.

It does not measure seconds, which depend on the machine. It measures **growth**: when n doubles, how does the work change?

- **O(1)**: same work for any n, e.g. \`nums[0]\`.
- **O(log n)**: doubling n adds one step, e.g. binary search.
- **O(n)**: doubling n doubles the work, e.g. one loop.
- **O(n²)**: doubling n makes it **4×**, e.g. a loop inside a loop.

Drop constants (\`O(3n)\` is \`O(n)\`) and keep the largest term (\`O(n² + n)\` is \`O(n²)\`).`,
          hi: `**Big-O** बताता है कि इनपुट बड़ा होने पर आपका कोड **कितना धीमा** (या कितनी मेमोरी लेने वाला) हो जाएगा।

यह सेकंड में नहीं नापता — सेकंड तो कंप्यूटर पर निर्भर करते हैं। यह **बढ़त** नापता है: n दोगुना हुआ तो काम कितना बढ़ा?

- **O(1)** — n कुछ भी हो, काम उतना ही।
- **O(log n)** — n दोगुना, काम बस एक कदम ज़्यादा।
- **O(n)** — n दोगुना, काम दोगुना।
- **O(n²)** — n दोगुना, काम **चार गुना**।

नियम: स्थिरांक हटाइए (\`O(3n)\` → \`O(n)\`), सबसे बड़ा पद रखिए।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Shaadi mein 500 mehmaan aaye hain aur tumhe apne dost **Rohan** ko dhoondhna hai:

- **O(1):** Rohan ne WhatsApp kiya "table number 12". Seedha wahan gaye. Mehmaan 500 ho ya 5000 — ek hi kadam.
- **O(n):** Kuch nahi pata — har table pe jaake dekho. 5000 mehmaan → 10 guna zyada chalna.
- **O(log n):** Guest register **alphabetically** sorted hai. Beech se kholo — "R" aage hai ya peeche? Aadha register hata do. Phir aadha. 1000 naam → sirf ~10 baar palatna.
- **O(n²):** Organiser chahta hai **har mehmaan har dusre mehmaan se haath milaye**. 500 log → lagbhag 1.25 lakh handshakes. 5000 log → 1.25 crore! Party kabhi khatam nahi hogi.

Code mein bhi yahi hota hai — chhote data pe sab theek lagta hai, bade data pe O(n²) ka asli roop dikhta hai.`,
          en: `500 guests at a wedding and you must find your friend **Rohan**:

- **O(1)**: he texted "table 12". One step, whatever the guest count.
- **O(n)**: no clue, so you visit every table. 10× guests, 10× walking.
- **O(log n)**: the guest register is alphabetical. Open the middle, discard half, repeat: about 10 flips for 1000 names.
- **O(n²)**: every guest must shake hands with every other guest. 500 people means about 1.25 lakh handshakes; 5000 means 1.25 crore.

Code behaves the same way: everything looks fine on small data until O(n²) meets big data.`,
          hi: `शादी में 500 मेहमान हैं और आपको अपने दोस्त **रोहन** को ढूँढना है:

- **O(1):** रोहन ने बताया "टेबल नंबर 12"। सीधे वहाँ गए — मेहमान कितने भी हों, एक ही कदम।
- **O(n):** कुछ पता नहीं — हर टेबल पर जाकर देखो।
- **O(log n):** मेहमानों का रजिस्टर वर्णक्रम में है। बीच से खोलो, आधा हटाओ, फिर आधा — 1000 नामों में सिर्फ़ ~10 बार।
- **O(n²):** हर मेहमान को हर दूसरे मेहमान से हाथ मिलाना है। 500 लोग → लगभग सवा लाख हाथ मिलाना!

कोड में भी यही होता है — छोटे डेटा पर सब ठीक, बड़े डेटा पर O(n²) का असली रूप दिखता है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Tumhara code 100 users pe 0.01 second leta hai. Badhiya! Par production mein 10 lakh users aaye:

- O(n) code → ~100 second... thoda slow, par chal jaayega with optimisation.
- O(n²) code → 100² se 10 lakh² — **10 crore guna** zyada kaam. Matlab din nikal jaayenge.

IRCTC Tatkal ke 10 baje wale rush ko socho — lakhon log ek saath. Wahan algorithm ka choice hi decide karta hai ki site chalegi ya girega.

Big-O se tum **code likhne se pehle** hi bata sakte ho ki ye scale karega ya nahi, aur do solutions ko machine ke bina compare kar sakte ho. Isliye har tech interview (Amazon, Google, Flipkart, startups) mein pehla follow-up hota hai: "**What's the time complexity?**"`,
          en: `Code that takes 0.01 seconds for 100 users may face 10 lakh users in production:

- O(n) code grows 10,000×: slow but manageable.
- O(n²) code grows 10 crore×: hopeless.

Think of the 10 AM Tatkal rush on IRCTC, with lakhs of people at once. Algorithm choice decides whether a system survives such load.

Big-O lets you predict scaling **before writing code** and compare solutions without a stopwatch. That is why nearly every technical interview asks: "What's the time complexity?"`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Databases (PostgreSQL, MySQL)** — bina index ke query poori table scan karti hai (O(n), PostgreSQL ke \`EXPLAIN\` mein "Seq Scan" dikhta hai). Index lagao toh B-tree se O(log n) lookup ("Index Scan"). 1 crore rows pe ye fark seconds vs milliseconds ka hai.
- **Google Search** — billions of pages ko har query pe scan karna impossible hai. Search engines **inverted index** banate hain: word → pages ki list, taaki lookup lagbhag direct ho.
- **Coding interviews (Amazon, Microsoft, Flipkart)** — har DSA round mein brute force ke baad poocha jaata hai "can you do better?" Matlab O(n²) se O(n log n) ya O(n) pe aao. Big-O hi wo bhasha hai jisme ye baat hoti hai.`,
          en: `- **Databases like PostgreSQL and MySQL**: without an index a query scans the whole table, O(n) ("Seq Scan" in PostgreSQL's \`EXPLAIN\`); with a B-tree index it is O(log n) ("Index Scan").
- **Google Search** cannot scan billions of pages per query, so search engines build an **inverted index** mapping words to pages.
- **Interviews at Amazon, Microsoft and Flipkart** ask "can you do better?" after a brute force, meaning move from O(n²) to O(n log n) or O(n). Big-O is the language for that conversation.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Big-O nikalne ka tareeka — "operations gino, n ke function mein":

1. **Simple statement** (assignment, \`+\`, index access) → O(1).
2. **Loop** jo n baar chale → body × n.
3. **Nested loops** → multiply: n × n = O(n²).
4. **Ek ke baad ek blocks** → add: O(n) + O(n²) = O(n²) (bada term jeet ta hai).
5. **Har step mein n aadha** → O(log n).
6. **Library calls ka cost bhi gino!** \`x in list\` O(n), \`list.insert(0, x)\` O(n), \`sorted()\` O(n log n), \`x in set\` O(1) average.

**Space complexity** — extra memory kitni: naya set/dict of n items → O(n) space.

Teen cases hote hain: **best**, **average**, **worst**. Big-O aam taur pe **worst case** batata hai. Aur **amortized** — jaise list append: kabhi-kabhi mehenga, average mein O(1).`,
          en: `How to derive Big-O, by counting operations as a function of n:

1. Simple statements are O(1).
2. A loop running n times costs n × body.
3. **Nested loops multiply**: O(n²).
4. **Sequential blocks add**, and the biggest term wins.
5. Halving n each step gives O(log n).
6. **Count library costs**: \`x in list\` is O(n), \`sorted()\` O(n log n), \`x in set\` O(1) average.

**Space complexity** counts extra memory, e.g. a set of n items is O(n). Big-O usually describes the **worst case**; **amortized** cost averages occasional expensive steps, like list append.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Is code mein chaar functions hain, har ek alag complexity ka, aur hum **steps gin** rahe hain (time nahi, taaki output har machine pe same ho):

- \`linear_steps\` — target list ke end mein hai → n steps. **O(n)**.
- \`halving_steps\` — n ko baar-baar aadha → ~log₂ n steps. **O(log n)**.
- \`pair_steps\` — har pair (i, j) → n(n−1)/2 steps. **O(n²)**.
- \`has_duplicate\` — set ke saath ek loop. **O(n) time, O(n) space**.

Output table dekho: n 10 se 1000 hua (100×) toh linear 100× badha, log wala sirf 3 → 9, aur pairs **45 se 4,99,500** — lagbhag 10,000×! Yahi O(n²) ka darr hai.`,
          en: `Four functions, each counting **steps** (not seconds) so output is identical on every machine:

- \`linear_steps\`: target at the end, n steps, **O(n)**.
- \`halving_steps\`: halves n repeatedly, about log₂ n steps, **O(log n)**.
- \`pair_steps\`: every pair, n(n−1)/2 steps, **O(n²)**.
- \`has_duplicate\`: one loop with a set, **O(n) time, O(n) space**.

When n grows 100× (10 to 1000), linear grows 100×, logarithmic goes from 3 to 9, and pairs jump from 45 to 499,500.`,
        },
        codeJs: `function linearSteps(nums, target) {   // O(n)
  let steps = 0;
  for (const x of nums) {
    steps++;
    if (x === target) break;
  }
  return steps;
}

function halvingSteps(n) {             // O(log n)
  let steps = 0;
  while (n > 1) {
    n = Math.floor(n / 2);
    steps++;
  }
  return steps;
}

function pairSteps(nums) {             // O(n^2)
  let steps = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) steps++;
  }
  return steps;
}

function hasDuplicate(nums) {          // O(n) time, O(n) space
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}

console.log("n", "linear", "log", "pairs");
for (const n of [10, 100, 1000]) {
  const data = Array.from({ length: n }, (_, i) => i);
  console.log(n, linearSteps(data, n - 1), halvingSteps(n), pairSteps(data));
}

console.log(hasDuplicate([4, 1, 7, 1]), hasDuplicate([4, 1, 7]));`,
        codePython: `def linear_steps(nums, target):      # O(n)
    steps = 0
    for x in nums:
        steps += 1
        if x == target:
            break
    return steps

def halving_steps(n):                # O(log n)
    steps = 0
    while n > 1:
        n //= 2
        steps += 1
    return steps

def pair_steps(nums):                # O(n^2)
    steps = 0
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            steps += 1
    return steps

def has_duplicate(nums):             # O(n) time, O(n) space
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False

print("n", "linear", "log", "pairs")
for n in [10, 100, 1000]:
    data = list(range(n))
    print(n, linear_steps(data, n - 1), halving_steps(n), pair_steps(data))

print(has_duplicate([4, 1, 7, 1]), has_duplicate([4, 1, 7]))`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **\`O(2n)\` ko \`O(n)\` se alag samajhna.** Constants drop hote hain — dono O(n).
2. **Hidden loops miss karna.** \`for x in a: if x in b:\` — dikhne mein ek loop, par \`in\` list pe khud ek loop hai → **O(n·m)**. Same for \`list.index\`, \`list.remove\`, string \`+=\` in loop (Python mein naya string banta hai).
3. **Do alag inputs ko ek n bolna.** Do lists \`a\` aur \`b\` hain → O(n + m) ya O(n·m), sirf "O(n)" nahi.
4. **Space bhool jaana.** Set/dict use kiya → extra O(n) memory. Interviewer poochega.
5. **Best case bata dena.** "Linear search O(1) hai kyunki pehla item mil sakta hai" — nahi, worst case O(n) batao.
6. **Recursion ki stack memory** gina hi nahi — depth n → O(n) space.`,
          en: `1. **Treating \`O(2n)\` as different from \`O(n)\`**: constants are dropped.
2. **Missing hidden loops**: \`if x in b\` inside a loop over \`a\` is O(n·m) when \`b\` is a list. The same goes for \`list.index\`, \`list.remove\` and repeated string concatenation.
3. **Calling two inputs "n"**: say O(n + m) or O(n·m).
4. **Forgetting space**: a set or dict adds O(n) memory.
5. **Quoting the best case** instead of the worst case.
6. **Ignoring recursion stack depth**, which costs O(depth) space.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `"Code slow hai" — kaise pata karein kahan aur kyun?

- **Doubling test:** input n, 2n, 4n pe time naapo. Time ~2× badha → O(n). ~4× → O(n²). Ye experimental Big-O hai.
- **Steps gino:** loop ke andar counter lagao (jaise CODE section mein). Asli number dikh jaata hai.
- **Profiler use karo:** Python mein \`python -m cProfile -s cumtime script.py\` — kaunsa function sabse zyada time kha raha hai, list mil jaayegi. JS/Node mein \`node --prof\` ya Chrome DevTools ka Performance tab.
- **Nested loops dhoondho** — aur un "chhupe loops" ko bhi: \`in\`, \`.index()\`, \`.count()\`, \`.remove()\` lists pe.
- Fix ke baad **dobara measure karo** — andaaze pe mat chhodo.`,
          en: `Finding out why code is slow:

- **Doubling test**: time n, 2n and 4n. About 2× growth suggests O(n); about 4× suggests O(n²).
- **Count steps** with a counter in the loop.
- **Use a profiler**: \`python -m cProfile -s cumtime script.py\`, or \`node --prof\` / Chrome DevTools for JavaScript.
- **Look for nested and hidden loops** such as \`in\`, \`.index()\`, \`.count()\` and \`.remove()\` on lists.
- **Measure again after fixing.**`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Big-O sab kuch nahi batata:

- **Constants matter for small n.** n = 20 pe O(n²) ka simple loop, O(n log n) ke complex code se tez ho sakta hai. Python ka \`sorted\` (Timsort) bhi chhote tukdon pe insertion sort use karta hai, isi wajah se.
- **Time vs space:** set/dict se O(n²) → O(n) ho jaata hai, par O(n) extra memory lagti hai. Memory tight ho (mobile, embedded) toh sort karke O(1) extra space wala solution better ho sakta hai.
- **Readability:** 5% speed ke liye code ko puzzle mat banao. Pehle sahi aur saaf, phir **measure**, phir optimise — "premature optimisation" se bacho.
- Real systems mein network call, disk I/O aur database query aksar loop se zyada mehenge hote hain. Big-O ke saath ye bhi gino.`,
          en: `Big-O is not everything:

- **Constants matter for small n**: a simple O(n²) loop can beat complex O(n log n) code at n = 20. Python's Timsort uses insertion sort on small runs for this reason.
- **Time vs space**: a set turns O(n²) into O(n) but costs O(n) memory; sorting in place may be better when memory is tight.
- **Readability**: correct and clear first, then measure, then optimise.
- In real systems, network calls, disk I/O and database queries often cost more than in-memory loops.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek internship ka real-type bug: "Orders page 20 second le raha hai."

\`\`\`python
for order in orders:                 # 50,000 orders
    for user in users:               # 50,000 users
        if user["id"] == order["user_id"]:
            order["user_name"] = user["name"]
\`\`\`

Ye O(n·m) = 50k × 50k = **250 crore** comparisons. Fix:

\`\`\`python
name_by_id = {u["id"]: u["name"] for u in users}   # O(m)
for order in orders:                                # O(n)
    order["user_name"] = name_by_id.get(order["user_id"])
\`\`\`

Ab O(n + m) = 1 lakh operations. Page 20 second se milliseconds pe. Thodi extra memory (dict) ke badle bahut bada speed-up — ye exact story interview mein "I optimised an endpoint" bol ke sunao.`,
          en: `A realistic internship bug: "the orders page takes 20 seconds."

\`\`\`python
for order in orders:                 # 50,000 orders
    for user in users:               # 50,000 users
        if user["id"] == order["user_id"]:
            order["user_name"] = user["name"]
\`\`\`

That is O(n·m), 2.5 billion comparisons. Building \`name_by_id = {u["id"]: u["name"] for u in users}\` first and looking up each order makes it O(n + m), about 1 lakh operations. A little extra memory buys a huge speed-up, and it makes a great interview story.`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "How many steps for n = 1,000?",
      steps: [
        {
          title: "O(1)",
          description: "Reading nums[0] or a dict lookup: 1 step, no matter how big n is.",
          highlight: "1",
        },
        {
          title: "O(log n)",
          description: "Halving the range each time: about 10 steps for 1,000 items, 20 for 10 lakh.",
          highlight: "~10",
        },
        {
          title: "O(n)",
          description: "One pass over the data: 1,000 steps.",
          highlight: "1,000",
        },
        {
          title: "O(n log n)",
          description: "Good sorting algorithms: about 1,000 × 10 = 10,000 steps.",
          highlight: "~10,000",
        },
        {
          title: "O(n²)",
          description: "Every pair: about 10 lakh (1,000,000) steps. At n = 10 lakh this becomes 10¹² — hours of work.",
          highlight: "~1,000,000",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Two nested loops, each running n times, do O(1) work inside. What is the time complexity?",
        options: ["O(n)", "O(2n)", "O(n²)", "O(log n)"],
        correct: [2],
        explanation: "Bahar ka loop n baar, har baar andar ka n baar → n × n = O(n²).",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does O(3n + 100) simplify to?",
        options: ["O(3n)", "O(n)", "O(100)", "O(n + 100)"],
        correct: [1],
        explanation: "Constants (3 aur 100) drop hote hain kyunki bade n pe growth n jaisi hi hai. Answer O(n).",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the time complexity of binary search on a sorted array?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correct: [1],
        explanation: "Har step mein search range aadhi hoti hai → log₂ n steps → O(log n).",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these Python operations are O(1) on average?",
        options: ["d[key] on a dict", "list.append(x)", "x in some_list", "some_list[i]"],
        correct: [0, 1, 3],
        explanation: "Dict lookup aur list append (amortized) aur index access O(1) hain. `x in list` har item check karta hai → O(n).",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `count = 0
n = 8
i = 1
while i < n:
    i *= 2
    count += 1
print(count)`,
        codeLanguage: "python",
        options: ["8", "4", "3", "7"],
        correct: [2],
        explanation: "i: 1 → 2 → 4 → 8. Teen baar double hua, phir `i < 8` False. 3 = log₂ 8 — ye O(log n) loop ka pattern hai.",
      },
      {
        type: "SPOT_BUG",
        difficulty: 2,
        prompt: "This function is correct but becomes very slow for two arrays of 1 lakh items each. What is the problem?",
        code: `function common(a, b) {
  const result = [];
  for (const x of a) {
    if (b.includes(x)) result.push(x);
  }
  return result;
}`,
        codeLanguage: "javascript",
        options: [
          "result.push is O(n), so the function is O(n²)",
          "b.includes is a hidden linear scan, making it O(n·m); use a Set for b",
          "for...of is slower than a classic for loop, making it O(n²)",
          "There is no problem; it is O(n)",
        ],
        correct: [1],
        explanation: "`b.includes(x)` khud poore `b` pe loop chalata hai, toh total O(n·m). Pehle `const set = new Set(b)` banao aur `set.has(x)` use karo → O(n + m).",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "An API matches 50,000 orders to 50,000 users using a nested loop and takes 20 seconds. What is the best first fix?",
        options: [
          "Buy a server with a faster CPU",
          "Build a dict from user id to user once, then look up each order in O(1)",
          "Sort the orders list first",
          "Run the nested loop in a background thread",
        ],
        correct: [1],
        explanation: "Users ka dict (id → user) ek baar banao, phir har order ka lookup O(1). Total O(n + m). Bada server sirf constant factor badalta hai, O(n·m) wahi rehta hai.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps to work out the Big-O of a function.",
        options: [
          "Decide what n (input size) is",
          "Find the cost of each loop and library call in terms of n",
          "Multiply costs of nested parts and add costs of sequential parts",
          "Drop constants and keep only the fastest-growing term",
        ],
        explanation: "Pehle n define karo, phir har block ka cost, phir nested = multiply / sequential = add, aur end mein simplify.",
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Why do we drop constants and smaller terms in Big-O?",
        keywords: ["growth", "large n", "constant", "dominant term"],
        explanation: "Big-O bade n pe growth ka shape batata hai. n bahut bada ho toh n² ke saamne n ya 100 negligible hai, aur 3n bhi n jaisa hi badhta hai. Constants machine/language pe depend karte hain, growth nahi.",
      },
    ],
    buildTask: {
      title: "Does the array have a duplicate? (in O(n))",
      description: `Function \`hasDuplicate(nums)\` likho jo \`true\` / \`True\` return kare agar array mein koi bhi number **do ya zyada baar** aaya hai, warna \`false\` / \`False\`.

Brute force (har pair compare) O(n²) hai. Tumhe **O(n) time** wala solution likhna hai — ek set ki madad se.

- Empty array ya ek item → \`false\`.
- Negative numbers bhi ho sakte hain.

Example: \`hasDuplicate([1, 2, 3, 1])\` → \`true\``,
      functionName: "hasDuplicate",
      starterJs: `function hasDuplicate(nums) {
  // TODO: aim for O(n) time using a Set
}`,
      starterPython: `def hasDuplicate(nums):
    # TODO: aim for O(n) time using a set
    pass`,
      tests: [
        {
          name: "1 appears twice",
          args: [
            [1, 2, 3, 1],
          ],
          expected: true,
        },
        {
          name: "all unique",
          args: [
            [1, 2, 3, 4],
          ],
          expected: false,
        },
        {
          name: "empty array",
          args: [
            [],
          ],
          expected: false,
        },
        {
          name: "single item",
          args: [
            [7],
          ],
          expected: false,
        },
        {
          name: "two equal items",
          args: [
            [5, 5],
          ],
          expected: true,
        },
        {
          name: "negatives",
          args: [
            [-1, 0, 1, -1],
          ],
          expected: true,
          hidden: true,
        },
        {
          name: "ten unique numbers",
          args: [
            [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
          ],
          expected: false,
          hidden: true,
        },
      ],
      hints: [
        "Ek 'seen' set rakho. Set mein check karna O(1) average hai, toh poora kaam ek hi pass mein ho jaayega.",
        "Step 1: khaali set banao. Step 2: har number ke liye — agar set mein pehle se hai toh turant True return. Warna set mein daal do. Step 3: loop khatam → False.",
        `seen = set()
for x in nums:
    if x in seen:
        return True
    seen.add(x)
# what should happen after the loop?`,
      ],
      explainQuestions: [
        {
          question: "What is the time and space complexity of your solution?",
          keywords: ["o(n) time", "o(n) space", "set", "one pass"],
        },
        {
          question: "How does your solution compare with checking every pair?",
          keywords: ["o(n²)", "nested", "pairs", "faster"],
        },
        {
          question: "Could you solve it with O(1) extra space? What would it cost?",
          keywords: ["sort", "o(n log n)", "adjacent", "modifies"],
        },
      ],
      estMinutes: 12,
    },
    interview: [
      {
        question: "What is Big-O notation and why does it matter?",
        short: "Big-O describes how an algorithm's time or memory grows as the input size grows, as an upper bound that ignores constants and lower-order terms. It lets us compare algorithms independent of hardware and predict whether code will scale; for example, an O(n²) solution that is fine for 1,000 items becomes unusable at 1,000,000.",
        deep: `- Common classes: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ).
- Rules: drop constants, keep the dominant term, nested loops multiply, sequential blocks add.
- Usually quoted for the worst case; also discuss space complexity.
- Related notations: Big-Omega (lower bound) and Big-Theta (tight bound); in interviews "Big-O" usually means the tight worst case.`,
        followUps: [
          "What is the difference between Big-O, Big-Omega and Big-Theta?",
          "What is the complexity of sorting in Python?",
          "Can an O(n²) algorithm ever be the better choice?",
        ],
        commonMistake: "Quoting the best case, or giving a single n when the function has two independent inputs.",
        keywords: ["growth rate", "input size", "worst case", "drop constants", "scalability"],
        difficulty: 1,
        roles: ["SDE", "BACKEND", "FRONTEND", "FULLSTACK"],
      },
      {
        question: "What does amortized O(1) mean? Give an example.",
        short: "Amortized cost is the average cost per operation over a long sequence, even if some individual operations are expensive. Appending to a dynamic array like a Python list or JavaScript array is amortized O(1): most appends write into spare capacity, and the occasional resize copies everything, but because capacity grows proportionally the total work for n appends is O(n).",
        deep: `- Total cost of resizes forms a geometric series bounded by a constant times n.
- Amortized is a guarantee over sequences, not an average over random inputs (that is 'average case').
- Other examples: hash table inserts with resizing, union-find with path compression.`,
        followUps: [
          "How is amortized different from average case?",
          "What growth factor does CPython use for lists?",
          "Why does a hash table resize?",
        ],
        commonMistake: "Equating amortized with average case over random inputs.",
        keywords: [
          "average over sequence",
          "occasional expensive",
          "resize",
          "dynamic array",
          "geometric growth",
        ],
        difficulty: 3,
        roles: ["SDE", "BACKEND"],
      },
    ],
    promptCard: {
      title: "Find the Big-O of my code and optimise it",
      category: "OPTIMIZATION",
      task: "Get a line-by-line time and space complexity analysis of your code, plus a faster approach explained step by step.",
      whenToUse: "When your solution passes small tests but times out on large inputs, or before an interview to check your complexity reasoning.",
      template: `Act as a DSA mentor. Analyse the time and space complexity of my code.

Language: [LANGUAGE]
Problem statement: [PROBLEM]
Constraints (input size limits): [CONSTRAINTS]

My code:
\`\`\`
[PASTE_CODE]
\`\`\`

1. Annotate each loop and library call with its cost, including hidden costs (like \`in\` on a list).
2. Give the overall time and space complexity with a one-line justification.
3. Tell me whether it will pass for the given constraints (assume about 10^8 simple operations per second).
4. If it is too slow, give a HINT for a better approach first. Show full code only after the hint.
5. State the new complexity and what trade-off (usually extra memory) it makes.`,
      variables: [
        {
          key: "LANGUAGE",
          label: "Programming language (Python or JavaScript)",
        },
        {
          key: "PROBLEM",
          label: "The problem statement in a few lines",
        },
        {
          key: "CONSTRAINTS",
          label: "Input size limits, e.g. n up to 10^5",
        },
        {
          key: "PASTE_CODE",
          label: "Your current solution",
        },
      ],
      whyItWorks: [
        {
          part: "Constraints included",
          why: "Whether O(n²) is acceptable depends entirely on n; without limits the analysis is incomplete.",
        },
        {
          part: "Annotate hidden costs",
          why: "Beginners miss library calls like `in`, `index` or string concatenation that hide extra loops.",
        },
        {
          part: "10^8 operations per second rule",
          why: "Turns abstract Big-O into a concrete pass/fail estimate, like online judges use.",
        },
        {
          part: "Hint before full code",
          why: "Keeps you thinking, which is what you need in a real interview.",
        },
      ],
      verifyChecklist: [
        "Count the loops yourself and check the AI's complexity matches.",
        "Run the optimised code on the original examples and compare outputs.",
        "Time both versions on a large generated input (doubling test).",
        "Confirm the stated space complexity accounts for any new set, dict or recursion.",
      ],
      sampleOutput: `Line 3: \`for x in a\` runs n times.
Line 4: \`if x in b\` scans list b, O(m) each time (hidden loop).
Overall: O(n·m) time, O(1) extra space.
With n = m = 10^5 that is 10^10 operations, too slow (~100 s).
Hint: what data structure answers "is x in b?" in O(1)?
Optimised: convert b to a set first, O(n + m) time, O(m) extra space.`,
    },
  },
  {
    slug: "hashing",
    estMinutes: 50,
    difficulty: 2,
    prerequisites: ["big-o", "arrays-strings"],
    objectives: [
      "Explain how a hash function maps keys to buckets in a hash map",
      "Describe collisions and how chaining and open addressing handle them",
      "Use hash maps and sets to turn O(n²) search problems into O(n)",
      "Solve Two Sum and frequency-counting problems with a hash map",
    ],
    technicalDefinition: "Hashing applies a hash function to a key to compute an index into an array of buckets; a hash map uses this to store key-value pairs with average O(1) insert, delete and lookup, degrading to O(n) when many keys collide.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Hashing** ek trick hai jisse kisi bhi key (naam, ID, number) ko ek **number (index)** mein badal dete hain, taaki data seedha us jagah rakha aur dhoondha ja sake.

- **Hash function:** key → number. Same key hamesha same number dega.
- **Hash map (dict / Map):** key → value store karta hai, average **O(1)** mein insert aur lookup.
- **Hash set:** sirf keys, duplicate nahi.
- **Collision:** do alag keys ka same index aa jaana. Isse handle karna padta hai.

DSA mein hashing ka main use: "kya maine ye pehle dekha hai?" jaise sawaalon ko O(n) se O(1) mein jawab dena.`,
          en: `**Hashing** turns any key (a name, ID or number) into a **number (index)** so data can be stored and found directly at that position.

- **Hash function**: key → number; the same key always gives the same number.
- **Hash map** (dict / Map): stores key → value with average **O(1)** insert and lookup.
- **Hash set**: keys only, no duplicates.
- **Collision**: two different keys landing on the same index, which must be handled.

In DSA, hashing answers "have I seen this before?" in O(1) instead of O(n).`,
          hi: `**हैशिंग** एक तरकीब है जिससे किसी भी key (नाम, ID, नंबर) को एक **संख्या (इंडेक्स)** में बदल देते हैं, ताकि डेटा सीधे उसी जगह रखा और ढूँढा जा सके।

- **हैश फ़ंक्शन:** key → संख्या। एक ही key हमेशा एक ही संख्या देगी।
- **हैश मैप:** key → value रखता है, औसतन **O(1)** में।
- **हैश सेट:** सिर्फ़ keys, कोई डुप्लिकेट नहीं।
- **कॉलिज़न:** दो अलग keys का एक ही इंडेक्स पर आ जाना।

DSA में इसका मुख्य उपयोग: "क्या मैंने यह पहले देखा है?" का जवाब O(1) में देना।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Hostel ka **letter box room** socho. 1000 students, 100 khaane (boxes).

Postman ka rule (yahi **hash function** hai): "roll number ke **aakhri do digit** dekho, us number wale box mein daal do." Roll 21BCE1047 → box 47.

- Tumhe apni chitthi chahiye? Poore 1000 letters mat chhaano — seedha **box 47** kholo. Ye hai **O(1) lookup**.
- Par 21BCE1147 ka bhi box 47 hai! Ye **collision** hai. Box ke andar 2–3 chitthiyan hongi, unme se apni naam dekh ke nikalo (**chaining**).
- Agar 100 boxes mein 5000 chitthiyan aa gayi toh har box mein 50 — dhoondhna phir slow. Isliye bade hostel mein **zyada boxes** lagte hain (**resize**).

Achha hash function chitthiyon ko sab boxes mein barabar baant ta hai.`,
          en: `Picture a hostel **mail room**: 1000 students, 100 boxes.

The postman's rule, the **hash function**, is "use the last two digits of the roll number". Roll 21BCE1047 goes to box 47.

- To get your letter you open **box 47** directly: an **O(1) lookup**.
- Roll 21BCE1147 also maps to box 47: a **collision**, so the box holds a few letters you check by name (**chaining**).
- With 5000 letters in 100 boxes, every box holds 50 and searching slows down, so a bigger hostel adds boxes (**resizing**).

A good hash function spreads letters evenly across boxes.`,
          hi: `हॉस्टल का **लेटर बॉक्स रूम** सोचिए। 1000 छात्र, 100 खाने।

डाकिए का नियम (यही **हैश फ़ंक्शन** है): "रोल नंबर के **आखिरी दो अंक** देखो, उसी नंबर वाले खाने में डालो।" रोल 21BCE1047 → खाना 47।

- अपनी चिट्ठी चाहिए? सारी 1000 चिट्ठियाँ मत देखो — सीधे **खाना 47** खोलो। यही **O(1) lookup** है।
- पर 21BCE1147 का भी खाना 47 है! यह **कॉलिज़न** है — खाने में 2–3 चिट्ठियाँ होंगी, नाम देखकर अपनी निकालो (**चेनिंग**)।
- चिट्ठियाँ बहुत बढ़ जाएँ तो **ज़्यादा खाने** लगाने पड़ते हैं (**रीसाइज़**)।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Bahut saare DSA sawaal asal mein ek hi sawaal hain: **"kya ye cheez pehle aa chuki hai?"**

- Two Sum: kya \`target − x\` pehle dekha?
- Duplicate: kya ye number pehle aaya?
- Anagram: dono strings mein har letter kitni baar?

Bina hashing ke har check ke liye poori list scan → loop ke andar loop → **O(n²)**. 1 lakh items = 10 billion comparisons.

Hash map ke saath har check O(1) → poora solution **O(n)**. Thodi extra memory dekar time mein bahut bachat. Isliye interview mein "brute force O(n²) hai, can you optimise?" ka sabse common jawab hota hai: **"hash map use karta hoon."**`,
          en: `Many DSA problems are secretly one question: **"have I seen this before?"**

- Two Sum: have I seen \`target − x\`?
- Duplicates: has this number appeared?
- Anagrams: how often does each letter appear?

Without hashing, each check scans the list, giving **O(n²)**. With a hash map each check is O(1) and the whole solution is **O(n)**, trading a little memory for a lot of time. That is the most common answer to "can you optimise this brute force?"`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Redis** — ek in-memory key-value store jo internally hash tables pe chalta hai. Bahut saari companies (Twitter, GitHub, Stack Overflow jaisi) isse caching aur sessions ke liye use karti hain: \`GET user:42\` seedha value deta hai, chahe crore keys hon.
- **Git** — har file aur commit ka content hash (SHA-1, naye setups mein SHA-256) se ek ID banta hai. Git objects ko isi hash ke naam se store karta hai, isliye same content dobara store nahi hota aur koi file badli toh hash turant badal jaata hai.
- **Python dict / JavaScript Map** — har backend (Django, Express) ka JSON, headers, cache — sab hash maps. Tumhara roz ka code bhi hashing pe chal raha hai.`,
          en: `- **Redis**, an in-memory key-value store built on hash tables, is used by companies like Twitter, GitHub and Stack Overflow for caching and sessions: \`GET user:42\` returns quickly even with crores of keys.
- **Git** identifies every file and commit by a content hash (SHA-1, or SHA-256 in newer setups), so identical content is stored once and any change produces a new hash.
- **Python dicts and JavaScript Maps** power JSON handling, headers and caches in every Django or Express backend.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Hash map ke andar ek **array of buckets** hota hai, size maan lo m.

1. **Insert(key, value):** \`index = hash(key) % m\`. Us bucket mein (key, value) rakh do.
2. **Lookup(key):** same formula → same bucket → key compare → value.
3. **Collision handling:**
   - **Chaining** — har bucket mein ek chhoti list; collide hue items usme append. (Java ka HashMap ye karta hai; bahut lambi chain ho toh tree mein badal deta hai.)
   - **Open addressing** — bucket bhara hai toh agla khaali slot dhoondho (linear/quadratic probing). CPython dict ye karta hai.
4. **Load factor** = items / buckets. Ye ek limit cross kare toh array **double** karke sab items **rehash** — ek operation O(n), par amortized O(1).

Worst case: sab keys ek hi bucket mein → lookup O(n). Isliye achha hash function aur resizing zaroori hai.`,
          en: `A hash map holds an **array of m buckets**.

1. **Insert**: \`index = hash(key) % m\`, store (key, value) there.
2. **Lookup**: same formula, same bucket, compare keys, return the value.
3. **Collisions**:
   - **Chaining**: each bucket holds a small list (Java's HashMap, which converts long chains to trees).
   - **Open addressing**: probe for another free slot (CPython's dict).
4. **Load factor** = items / buckets. Past a threshold the array grows and every item is **rehashed**: O(n) once, amortized O(1).

If all keys land in one bucket, lookups degrade to O(n).`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `**Two Sum** — "array mein do numbers dhoondho jinka sum target ho, unke indices do."

- \`seen\` dict: number → uska index.
- Har \`x\` ke liye \`need = target − x\`. Agar \`need\` pehle dekha hai → answer \`[seen[need], i]\`.
- Nahi toh \`x\` ko \`seen\` mein daal do. **Check pehle, insert baad mein** — taaki same element do baar use na ho.

Phir **frequency count**: \`Counter\` (Python) / Map (JS) se har character ki ginti, aur \`first_unique\` — pehla character jo sirf ek baar aaya.

**Complexity:** Two Sum O(n) time, O(n) space (dict). Frequency O(n) time, O(k) space (k = unique characters). Brute force Two Sum O(n²) hota.`,
          en: `**Two Sum**: find indices of two numbers adding up to the target.

- \`seen\` maps number → index.
- For each \`x\`, compute \`need = target − x\`; if \`need\` was seen, return \`[seen[need], i]\`.
- Otherwise store \`x\`. **Check before inserting** so one element is never used twice.

Then a **frequency count** with \`Counter\` or a Map, used to find the first character that appears once.

**Complexity**: Two Sum is O(n) time and O(n) space; frequency counting is O(n) time and O(k) space for k distinct characters. Brute-force Two Sum would be O(n²).`,
        },
        codeJs: `function twoSum(nums, target) {
  const seen = new Map();          // number -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}

function firstUnique(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  for (const ch of s) if (counts.get(ch) === 1) return ch;
  return null;
}

console.log(twoSum([3, 8, 4, 6], 10));
console.log(twoSum([2, 7, 11, 15], 9));
console.log(twoSum([1, 2], 10));
const freq = new Map();
for (const ch of "banana") freq.set(ch, (freq.get(ch) || 0) + 1);
console.log([...freq.entries()].sort((a, b) => b[1] - a[1]));
console.log(firstUnique("swiss"), firstUnique("aabb"));`,
        codePython: `from collections import Counter

def two_sum(nums, target):
    seen = {}                      # number -> index
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []

def first_unique(s):
    counts = Counter(s)
    for ch in s:
        if counts[ch] == 1:
            return ch
    return None

print(two_sum([3, 8, 4, 6], 10))
print(two_sum([2, 7, 11, 15], 9))
print(two_sum([1, 2], 10))
print(Counter("banana").most_common())
print(first_unique("swiss"), first_unique("aabb"))`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **Two Sum mein insert pehle, check baad mein** — \`[3]\` target 6 pe 3 khud se jud jaayega, galat answer \`[0, 0]\`. Pehle check, phir insert.
2. **Mutable key** — Python mein list key nahi ban sakti. JS mein object/array ko plain object \`{}\` ki key banaya toh wo \`"[object Object]"\` ya \`"1,2"\` string ban jaati hai — sab objects ek hi key pe! \`Map\` use karo.
3. **JS object keys hamesha string** — \`obj[1]\` aur \`obj["1"]\` same hain. Number vs string ka fark chahiye toh \`Map\`.
4. **Order pe bharosa** — hash set ka iteration order logic mein use mat karo.
5. **"Hash map hamesha O(1)" bolna** — average O(1), worst case O(n). Interview mein ye fark batao.
6. **Brute force ke saath hi ruk jaana** — nested loop dikhe aur andar "search" ho, toh hash map ka socho.`,
          en: `1. **Inserting before checking** in Two Sum lets an element pair with itself (\`[0, 0]\`).
2. **Mutable or object keys**: Python rejects list keys; JavaScript plain objects turn object keys into strings like \`"[object Object]"\`. Use \`Map\`.
3. **JavaScript object keys are strings**: \`obj[1]\` and \`obj["1"]\` are the same.
4. **Relying on hash set iteration order.**
5. **Claiming O(1) always**: it is average O(1), worst case O(n).
6. **Stopping at brute force**: a nested loop that searches is a hint to use a hash map.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `- **Har step pe map print karo:** \`print(i, x, need, seen)\`. Two Sum mein dikh jaayega ki element kab add hua aur kab mila.
- **Duplicate values se test karo:** \`[3, 3]\` target 6 → \`[0, 1]\` aana chahiye. Duplicates pe hi aksar bugs nikalte hain (dict mein same key overwrite ho jaati hai — kya ye tumhe chahiye?).
- **Key type check:** \`print(type(key))\` — \`"42"\` aur \`42\` alag keys hain (Python & JS Map dono mein). JSON/URL se aaye IDs strings hote hain.
- **Edge cases:** empty input, ek element, koi answer nahi, negative numbers, zero.
- **"Bahut slow hai" hash map ke saath bhi?** Check karo kahin custom object ka hash sab ke liye same toh nahi (bura \`__hash__\`) — sab ek bucket mein → O(n).`,
          en: `- **Print the map at every step**, e.g. \`print(i, x, need, seen)\`.
- **Test duplicates** like \`[3, 3]\` with target 6; also remember a dict overwrites repeated keys.
- **Check key types**: \`"42"\` and \`42\` are different keys; IDs from JSON or URLs are often strings.
- **Edge cases**: empty input, one element, no answer, negatives and zero.
- **Still slow?** A custom object with a poor \`__hash__\` can put every key in one bucket, making lookups O(n).`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Hash map super-useful hai, par:

- **Extra memory** — O(n) space. Memory tight hai aur array sort kar sakte ho → sort + two pointers (O(n log n), O(1) extra).
- **Order nahi** — "sabse chhoti key", "range 10–20 ke saare keys" jaise sawaal hash map se slow hain. Iske liye sorted structures (BST / TreeMap, sorted list + binary search) better.
- **Worst case O(n)** — collisions. Attackers jaan-boojh ke colliding keys bhej sakte hain (**hash flooding**); isliye Python har process mein string hashes randomise karta hai.
- **Chhota data** (10–20 items) — simple list scan bhi utna hi fast, aur kam memory.
- Exact match ke liye perfect; "approximately similar" (spelling mistakes) ke liye nahi.`,
          en: `Hash maps are very useful, but:

- **Extra O(n) memory**; if you can sort, sort plus two pointers uses O(1) extra space at O(n log n).
- **No ordering**: "smallest key" or "all keys between 10 and 20" need sorted structures like a BST, TreeMap or sorted list with binary search.
- **Worst case O(n)** under collisions; attackers can send colliding keys (**hash flooding**), which is why Python randomises string hashes per process.
- **Tiny data** is fine with a plain list.
- Hashing finds exact matches, not "similar" ones.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `**Idempotency / duplicate payment check.** Payment gateways ka webhook kabhi-kabhi same event do baar bhej deta hai (network retry). Agar tum dono baar order "paid" mark karke inventory ghata do — gadbad.

\`\`\`python
processed = set()   # production mein ye Redis set / DB unique key hota hai

def handle_webhook(event):
    if event["id"] in processed:      # O(1)
        return "duplicate, ignored"
    processed.add(event["id"])
    mark_order_paid(event["order_id"])
    return "processed"
\`\`\`

Har event ID ek hash set mein. Lakhon events ke baad bhi check O(1). Real systems mein ye set Redis mein hota hai (expiry ke saath) ya database mein unique constraint. Interview mein "idempotency" shabd bolo — impress karega.`,
          en: `**Idempotent webhooks.** Payment gateways sometimes deliver the same event twice because of retries. Processing it twice would double-reduce inventory.

\`\`\`python
processed = set()   # in production: a Redis set or a DB unique key

def handle_webhook(event):
    if event["id"] in processed:
        return "duplicate, ignored"
    processed.add(event["id"])
    mark_order_paid(event["order_id"])
    return "processed"
\`\`\`

The check stays O(1) after lakhs of events. Real systems keep this in Redis with an expiry or rely on a database unique constraint.`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "Two Sum with a hash map: nums = [3, 8, 4, 6], target = 10",
      steps: [
        {
          title: "i = 0, x = 3",
          description: "need = 10 − 3 = 7. Is 7 in seen? No. Store 3 → 0.",
          highlight: "seen = {3: 0}",
        },
        {
          title: "i = 1, x = 8",
          description: "need = 2. Not in seen. Store 8 → 1.",
          highlight: "seen = {3: 0, 8: 1}",
        },
        {
          title: "i = 2, x = 4",
          description: "need = 6. Not in seen yet (6 comes later). Store 4 → 2.",
          highlight: "seen = {3: 0, 8: 1, 4: 2}",
        },
        {
          title: "i = 3, x = 6",
          description: "need = 4. 4 IS in seen at index 2. Answer found!",
          highlight: "return [2, 3]",
        },
        {
          title: "Why it is O(n)",
          description: "One pass, and every 'is it in seen?' check is an O(1) average hash lookup. Brute force would compare all 6 pairs; for n = 1 lakh that is ~5 billion pairs.",
          highlight: "O(n) time, O(n) space",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the average time complexity of a lookup in a hash map?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correct: [0],
        explanation: "Hash se seedha bucket milta hai, toh average O(1). Worst case (bahut collisions) O(n).",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is a collision in a hash table?",
        options: [
          "Two equal keys inserted twice",
          "Two different keys mapping to the same bucket",
          "The table running out of memory",
          "A key with no value",
        ],
        correct: [1],
        explanation: "Do alag keys ka hash/index same aa jaana collision hai. Chaining ya open addressing se handle hota hai.",
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Why can a Python list not be used as a dict key?",
        options: [
          "Lists are too large",
          "Lists are mutable, so their hash could change after insertion",
          "Lists are ordered",
          "Only strings can be keys",
        ],
        correct: [1],
        explanation: "List mutable hai — badalne pe uska hash badal jaata, aur entry galat bucket mein 'kho' jaati. Isliye Python lists ko unhashable maanta hai.",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these are collision-resolution techniques?",
        options: ["Separate chaining", "Linear probing", "Quadratic probing", "Bubble sort"],
        correct: [0, 1, 2],
        explanation: "Chaining, linear probing aur quadratic probing collisions handle karte hain. Bubble sort ka hashing se koi lena-dena nahi.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this JavaScript code print?",
        code: `const obj = {};
obj[1] = "one";
obj["1"] = "string one";
const m = new Map();
m.set(1, "one");
m.set("1", "string one");
console.log(Object.keys(obj).length, m.size);`,
        codeLanguage: "javascript",
        options: ["2 2", "1 2", "1 1", "2 1"],
        correct: [1],
        explanation: "Plain object ki keys hamesha strings hoti hain, toh `obj[1]` aur `obj[\"1\"]` same key hai → 1 key. `Map` type preserve karta hai, number 1 aur string \"1\" alag → size 2.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `def first_repeat(s):
    seen = set()
    for ch in s:
        if ch in seen:
            return ch
        seen.add(ch)
    return None

print(first_repeat("prompters"), first_repeat("abc"))`,
        codeLanguage: "python",
        options: ["r None", "p None", "p a", "o None"],
        correct: [1],
        explanation: "\"prompters\" mein p, r, o, m dekhe, phir agla 'p' already set mein hai → 'p' return. \"abc\" mein koi repeat nahi → None.",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "A refund tool must check whether any two transactions (out of 1 lakh) add up exactly to a disputed amount. Which approach is best?",
        options: [
          "Compare every pair with two nested loops",
          "One pass with a hash set, checking target − amount for each transaction",
          "Sort and then compare every pair",
          "Pick random pairs until one matches",
        ],
        correct: [1],
        explanation: "Ek pass mein har amount ke liye `target − amount` hash set mein check karo — O(n). Nested loop O(n²) = 5 billion comparisons.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps of inserting a key-value pair into a hash map with chaining.",
        options: [
          "Compute hash(key)",
          "Reduce it to a bucket index with hash % capacity",
          "Update the value if the key exists in that bucket, otherwise append the pair",
          "If the load factor is too high, grow the array and rehash all keys",
        ],
        explanation: "Hash nikalo → index → bucket mein key already hai toh update warna append → load factor zyada ho toh resize.",
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why is hash map lookup O(n) in the worst case?",
        keywords: ["collision", "same bucket", "bad hash", "compare each"],
        explanation: "Agar bahut saari keys same bucket mein collide karein (bura hash function ya jaan-boojh ke attack), toh us bucket ki chain/probe sequence mein ek-ek key compare karni padegi — n tak. Resizing aur achha hash isse average O(1) rakhte hain.",
      },
    ],
    buildTask: {
      title: "Two Sum",
      description: `Interview ka sabse famous sawaal! Function \`twoSum(nums, target)\` likho jo do **alag** positions \`i < j\` return kare jahan \`nums[i] + nums[j] == target\`.

- Return \`[i, j]\` with \`i < j\`.
- Tests mein **exactly ek** valid pair hoga — ya koi nahi. Koi pair nahi → \`[]\`.
- Same element do baar use nahi kar sakte.
- **O(n)** mein karo — hash map se. Nested loop (O(n²)) mat lagao.

Example: \`twoSum([2, 7, 11, 15], 9)\` → \`[0, 1]\``,
      functionName: "twoSum",
      starterJs: `function twoSum(nums, target) {
  // TODO: use a Map from number -> index
  return [];
}`,
      starterPython: `def twoSum(nums, target):
    # TODO: use a dict from number -> index
    return []`,
      tests: [
        {
          name: "classic",
          args: [
            [2, 7, 11, 15],
            9,
          ],
          expected: [0, 1],
        },
        {
          name: "answer not at the start",
          args: [
            [3, 2, 4],
            6,
          ],
          expected: [1, 2],
        },
        {
          name: "same value twice",
          args: [
            [3, 3],
            6,
          ],
          expected: [0, 1],
        },
        {
          name: "no pair",
          args: [
            [1, 2, 3],
            100,
          ],
          expected: [],
        },
        {
          name: "negative numbers",
          args: [
            [-1, -2, -3, -4, -5],
            -8,
          ],
          expected: [2, 4],
        },
        {
          name: "zeros",
          args: [
            [0, 4, 3, 0],
            0,
          ],
          expected: [0, 3],
          hidden: true,
        },
        {
          name: "big values",
          args: [
            [5, 75, 25],
            100,
          ],
          expected: [1, 2],
          hidden: true,
        },
      ],
      hints: [
        "Har number x ke liye tumhe pata hai ki uska 'partner' target − x hona chahiye. Ek hash map mein pehle dekhe gaye numbers aur unke index rakho.",
        "Step 1: khaali map. Step 2: index i pe need = target − nums[i]. Agar need map mein hai → [map[need], i] return. Step 3: warna nums[i] → i map mein daalo. Step 4: loop khatam → [].",
        `seen = {}
for i, x in enumerate(nums):
    need = target - x
    if need in seen:
        return [seen[need], i]
    # store x here`,
      ],
      explainQuestions: [
        {
          question: "What is the time and space complexity of your solution?",
          keywords: ["o(n) time", "o(n) space", "one pass", "hash map"],
        },
        {
          question: "Why do you check the map before inserting the current number?",
          keywords: ["same element", "twice", "itself", "duplicate"],
        },
        {
          question: "How would the brute-force solution work and why is it slower?",
          keywords: ["nested loops", "every pair", "o(n²)"],
        },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "How does a hash map work internally?",
        short: "A hash map keeps an array of buckets. To insert, it hashes the key, takes the hash modulo the array size to get a bucket, and stores the key-value pair there. Lookups repeat the same computation and compare keys in that bucket. Collisions are handled by chaining or open addressing, and the array is resized and rehashed when the load factor gets too high, giving average O(1) operations.",
        deep: `- **Hash function**: deterministic, fast, spreads keys uniformly; equal keys must have equal hashes.
- **Chaining** (Java HashMap; long chains become balanced trees since Java 8) vs **open addressing** (CPython dict, probing).
- **Load factor** threshold (e.g. 0.75 in Java, about 2/3 in CPython) triggers resize; rehashing is O(n) but amortized O(1) per insert.
- **Worst case** O(n) when keys collide; defences include randomised hashing and tree-ified buckets.`,
        followUps: [
          "What is a load factor?",
          "How does Java 8 improve worst-case HashMap lookups?",
          "Why must equal objects have equal hash codes?",
        ],
        commonMistake: "Forgetting the equality comparison: the hash only finds the bucket; keys still have to be compared.",
        keywords: ["buckets", "hash function", "collision", "load factor", "rehash"],
        difficulty: 2,
        roles: ["SDE", "BACKEND"],
      },
      {
        question: "Solve Two Sum and explain its complexity.",
        short: "Iterate once, keeping a hash map from value to index. For each number, compute target minus the number; if that complement is already in the map, return its index and the current index. Otherwise store the current number. This is O(n) time and O(n) space, versus O(n²) for checking every pair.",
        deep: `\`\`\`python
def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []
\`\`\`
- Checking before inserting prevents using one element twice.
- If the array is sorted (or indices are not needed), two pointers give O(1) extra space.`,
        followUps: [
          "What if the array is sorted?",
          "How would you return all pairs?",
          "How would you solve 3Sum?",
        ],
        commonMistake: "Inserting the current number before checking, which can pair an element with itself.",
        keywords: ["complement", "hash map", "one pass", "o(n)", "check before insert"],
        difficulty: 2,
        roles: ["SDE", "BACKEND", "FRONTEND"],
      },
      {
        question: "When would you not use a hash map?",
        short: "When you need ordered operations such as range queries, the minimum or maximum key, or sorted iteration; when memory is very tight; when data is tiny; or when worst-case guarantees matter more than average speed. In those cases a balanced BST or TreeMap, a sorted array with binary search, or plain arrays can be better.",
        deep: `- Range query "all orders between 10:00 and 10:15": sorted structure, O(log n + k).
- Memory: hash tables keep empty slots plus stored hashes.
- Adversarial input: collisions degrade to O(n).
- Small fixed key spaces (e.g. 26 letters) are simpler and faster with a plain array of counts.`,
        followUps: [
          "What is a TreeMap?",
          "How would you count letters without a hash map?",
          "What is hash flooding?",
        ],
        commonMistake: "Treating hash maps as the answer to every problem without considering ordering needs.",
        keywords: ["ordering", "range query", "memory", "worst case", "bst"],
        difficulty: 3,
        roles: ["SDE", "BACKEND"],
      },
    ],
  },
  {
    slug: "two-pointers",
    estMinutes: 45,
    difficulty: 2,
    prerequisites: ["arrays-strings", "big-o"],
    objectives: [
      "Use opposite-end pointers on a sorted array to find pairs in O(n)",
      "Use same-direction (slow/fast) pointers to remove duplicates in place",
      "Explain why moving a pointer never skips the correct answer",
      "Check palindromes and merge sorted sequences with two pointers",
    ],
    technicalDefinition: "The two-pointer technique maintains two indices into a sequence, moving them toward each other or in the same direction according to a rule that provably discards impossible candidates, reducing many O(n²) pair searches to O(n) with O(1) extra space.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Two pointers** matlab array pe **do index** (\`left\` aur \`right\`) ek saath chalana, taaki nested loop ki zaroorat na pade.

Do main style hain:
- **Opposite ends:** \`left = 0\`, \`right = n − 1\`, dono beech ki taraf aate hain. Sorted array mein pair sum, palindrome check.
- **Same direction (slow / fast):** dono left se chalte hain, fast aage explore karta hai, slow "result" ki jagah yaad rakhta hai. Duplicates hatana, merge karna.

Fayda: brute force O(n²) → **O(n) time, O(1) extra space**. Shart: aksar array **sorted** hona chahiye, ya problem mein koi aisa rule ho jo bataye ki kaunsa pointer khiskana hai.`,
          en: `**Two pointers** means moving **two indices** (\`left\` and \`right\`) over an array together, so you avoid a nested loop.

Two main styles:
- **Opposite ends**: \`left = 0\`, \`right = n − 1\`, moving toward each other. Used for pair sums in sorted arrays and palindrome checks.
- **Same direction (slow/fast)**: both start at the left; fast explores, slow marks where the result goes. Used to remove duplicates and merge.

The gain is O(n²) → **O(n) time with O(1) extra space**. It usually needs a **sorted** array or a rule that tells you which pointer to move.`,
          hi: `**टू पॉइंटर्स** का मतलब है ऐरे पर **दो इंडेक्स** (\`left\` और \`right\`) एक साथ चलाना, ताकि नेस्टेड लूप की ज़रूरत न पड़े।

दो मुख्य तरीके:
- **दोनों सिरों से:** \`left = 0\`, \`right = n − 1\`, दोनों बीच की ओर आते हैं — सॉर्टेड ऐरे में जोड़ी ढूँढना, पैलिंड्रोम जाँचना।
- **एक ही दिशा में (slow / fast):** दोनों बाएँ से चलते हैं — डुप्लिकेट हटाना, मर्ज करना।

फ़ायदा: O(n²) से **O(n) समय और O(1) अतिरिक्त जगह**। शर्त: अक्सर ऐरे **सॉर्टेड** होना चाहिए।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Tumhare paas **₹500 ka gift voucher** hai, aur DMart ki price list **sasti se mehngi** order mein lagi hai. Tumhe exactly ₹500 ke **do items** chahiye.

Tum aur tumhara dost:
- Tum list ke **sabse saste** item pe ungli rakhte ho (left).
- Dost **sabse mehnge** item pe (right).
- Dono ka total **₹500 se zyada**? Mehnga wala dost ek kadam **neeche** aata hai — kyunki sabse saste ke saath bhi zyada hai, toh mehnga item kisi ke saath nahi chalega.
- Total **kam**? Tum ek kadam **upar** jaate ho — sasta item sabse mehnge ke saath bhi kam pad raha hai, toh wo bekaar.
- **Exactly ₹500?** Mil gaya!

Har kadam pe ek item pakka "out" hota hai. Isliye max n kadam — har pair try karne ki zaroorat nahi.`,
          en: `You have a **₹500 gift voucher** and a DMart price list sorted **cheapest to costliest**. You need **two items** totalling exactly ₹500.

- You point at the **cheapest** item (left); your friend points at the **costliest** (right).
- Total **above ₹500**? Your friend moves **down**: the costly item is too much even with the cheapest one.
- Total **below ₹500**? You move **up**: the cheap item falls short even with the costliest one.
- **Exactly ₹500?** Done.

Every step rules out one item for good, so at most n steps are needed instead of trying every pair.`,
          hi: `आपके पास **₹500 का गिफ़्ट वाउचर** है और DMart की कीमतों की सूची **सस्ते से महँगे** क्रम में है। आपको exactly ₹500 के **दो सामान** चाहिए।

- आप **सबसे सस्ते** सामान पर उँगली रखते हैं, दोस्त **सबसे महँगे** पर।
- कुल **₹500 से ज़्यादा**? दोस्त एक कदम **नीचे** आता है — महँगा सामान सबसे सस्ते के साथ भी ज़्यादा है।
- कुल **कम**? आप एक कदम **ऊपर** जाते हैं।
- **ठीक ₹500?** मिल गया!

हर कदम पर एक सामान पक्का बाहर होता है, इसलिए हर जोड़ी आज़माने की ज़रूरत नहीं।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `"Sorted array mein do numbers dhoondho jinka sum target ho" — brute force: har pair check karo. n = 1 lakh → lagbhag **500 crore pairs**. Online judge pe **Time Limit Exceeded**.

Two pointers sorted order ka fayda uthata hai: sum zyada hai toh right ko chhota karo, kam hai toh left ko bada. Har step mein ek element hamesha ke liye discard → max **n steps**.

Aur hash map (Two Sum wala) bhi O(n) hai, toh two pointers kyun? Kyunki:
- **O(1) extra memory** — koi dict nahi.
- Palindrome, reverse, merge, duplicates hatana — ye kaam **in-place** hote hain, hash map yahan fit hi nahi hota.

Interviews mein 3Sum, Container With Most Water, Trapping Rain Water — sab isi pattern pe hain.`,
          en: `Finding two numbers that sum to a target in a sorted array by checking every pair costs about 5 billion pairs for n = 1 lakh, a guaranteed time-limit error.

Two pointers uses the sorted order: if the sum is too big move right inward, if too small move left. Each step discards one element forever, so at most **n steps**.

Why not a hash map? Two pointers needs **O(1) extra memory**, and tasks like palindromes, reversing, merging and in-place deduplication do not fit a hash map at all. Problems like 3Sum and Container With Most Water rely on this pattern.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **PostgreSQL merge join** — jab do tables join key pe sorted hon, PostgreSQL "Merge Join" plan use kar sakta hai: dono sorted inputs pe ek-ek pointer, chhota wala aage badhao, match pe row output. Bilkul merge-two-sorted-lists jaisa.
- **Python / Java ka sort (Timsort)** — Timsort data ke sorted "runs" dhoondh ke unhe **merge** karta hai, aur merge step do pointers se hi hota hai.
- **Unix \`comm\` aur \`join\` commands** — do sorted files ko line-by-line compare karke batate hain kaunsi lines dono mein hain, kaunsi sirf ek mein. Ek pointer har file pe, poori file memory mein load kiye bina.`,
          en: `- **PostgreSQL merge join**: when both inputs are sorted on the join key, the planner can walk one pointer per input, advance the smaller side and emit matches, just like merging sorted lists.
- **Timsort** in Python and Java finds sorted runs and merges them, and merging is a two-pointer process.
- **Unix \`comm\` and \`join\`** compare two sorted files line by line with one pointer per file, without loading them fully into memory.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Pair sum (sorted array) kyun kabhi galat nahi hota? **Invariant** samjho: "agar answer exist karta hai, toh wo \`left\` aur \`right\` ke beech hai."

1. \`sum = a[left] + a[right]\`.
2. \`sum > target\` → \`a[right]\` ko **kisi bhi** baaki element ke saath jodo, sum aur bada ya barabar hi hoga (kyunki \`a[left]\` sabse chhota bacha hai). Toh \`a[right]\` kabhi answer ka hissa nahi → \`right -= 1\`.
3. \`sum < target\` → same logic ulta: \`a[left]\` sabse bade ke saath bhi kam → \`left += 1\`.
4. Har step mein window ek chhoti → max n−1 steps → **O(n)**.

**Slow/fast style** (duplicates hatana): \`slow\` = agla unique element kahan likhna hai. \`fast\` har element dekhta hai; naya value mile toh \`a[slow] = a[fast]\`, \`slow += 1\`. End mein \`slow\` = unique count.

Loop condition \`left < right\` — \`<=\` likha toh ek hi element khud se pair ban jaayega.`,
          en: `Why pair sum on a sorted array never misses: keep the **invariant** "if an answer exists, it lies between \`left\` and \`right\`."

1. Compute \`sum = a[left] + a[right]\`.
2. If \`sum > target\`, \`a[right]\` with any remaining element is at least as big (since \`a[left]\` is the smallest left), so drop it: \`right -= 1\`.
3. If \`sum < target\`, \`a[left]\` is too small even with the largest: \`left += 1\`.
4. The range shrinks every step, so **O(n)**.

In the **slow/fast** style, \`slow\` marks where the next unique value goes and \`fast\` scans. Use \`left < right\` so an element never pairs with itself.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Teen functions:

- \`pair_with_sum\` — opposite-end pointers, sorted array, values ka pair return (ya \`None\`/\`null\`).
- \`remove_duplicates\` — slow/fast pointers, sorted list ko **in-place** unique banata hai aur unique count return karta hai.
- \`is_palindrome\` — dono taraf se compare, beech mein milne tak.

Print statements har function ka output dikhate hain, including "nahi mila" wala case.

**Complexity:** teeno **O(n) time, O(1) extra space**. (Agar array sorted nahi hai, pehle sort → O(n log n).)`,
          en: `Three functions:

- \`pair_with_sum\`: opposite-end pointers on a sorted array, returning the pair of values or \`None\`/\`null\`.
- \`remove_duplicates\`: slow/fast pointers that deduplicate a sorted list **in place** and return the unique count.
- \`is_palindrome\`: compares from both ends until the pointers meet.

**Complexity**: all three are **O(n) time and O(1) extra space**; unsorted input needs an O(n log n) sort first.`,
        },
        codeJs: `function pairWithSum(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const s = nums[left] + nums[right];
    if (s === target) return [nums[left], nums[right]];
    if (s < target) left++;
    else right--;
  }
  return null;
}

function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  let slow = 1;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[fast - 1]) {
      nums[slow] = nums[fast];
      slow++;
    }
  }
  return slow;
}

function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}

console.log(pairWithSum([1, 3, 4, 6, 8, 11], 10));
console.log(pairWithSum([1, 2, 3], 100));

const data = [1, 1, 2, 3, 3, 3, 7];
const k = removeDuplicates(data);
console.log(k, data.slice(0, k));

console.log(isPalindrome("racecar"), isPalindrome("chai"));`,
        codePython: `def pair_with_sum(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return (nums[left], nums[right])
        if s < target:
            left += 1
        else:
            right -= 1
    return None

def remove_duplicates(nums):
    if not nums:
        return 0
    slow = 1
    for fast in range(1, len(nums)):
        if nums[fast] != nums[fast - 1]:
            nums[slow] = nums[fast]
            slow += 1
    return slow

def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True

print(pair_with_sum([1, 3, 4, 6, 8, 11], 10))
print(pair_with_sum([1, 2, 3], 100))

data = [1, 1, 2, 3, 3, 3, 7]
k = remove_duplicates(data)
print(k, data[:k])

print(is_palindrome("racecar"), is_palindrome("chai"))`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **Unsorted array pe opposite-end pair sum** — "sum zyada hai toh right ghatao" wala logic sirf sorted pe sahi hai. Pehle sort karo (indices chahiye toh hash map better).
2. **Pointers ulte khiskana** — sum kam hai aur \`right--\` kar diya. Socho: sum badhana hai toh bada number chahiye → \`left++\`.
3. **\`left <= right\`** — same element khud se pair ban jaata hai (\`[5]\`, target 10 → galat answer).
4. **Pointer move karna bhool jaana** — kisi branch mein \`left\`/\`right\` nahi badla → **infinite loop**.
5. **Palindrome mein case/spaces** — "Race car" ko ignore-case aur non-alphanumeric skip ke bina check kiya toh False aayega.
6. **3Sum mein duplicates skip na karna** — same triplet baar-baar output.`,
          en: `1. **Using opposite-end pair sum on unsorted data**: the move rule only works when sorted.
2. **Moving the wrong pointer**: a small sum needs a bigger number, so \`left++\`.
3. **\`left <= right\`** lets an element pair with itself.
4. **Forgetting to move a pointer** in some branch, causing an infinite loop.
5. **Ignoring case and punctuation** in palindrome problems.
6. **Not skipping duplicates** in 3Sum, producing repeated triplets.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `- **Har step trace karo:** \`print(left, right, nums[left], nums[right], s)\`. 4–5 lines mein dikh jaata hai ki pointer galat taraf ja raha hai ya ruk gaya hai.
- **Paper pe dry run:** array likho, neeche L aur R ke arrows banao, har step update karo. Interview mein bhi yahi karo — interviewer ko pasand aata hai.
- **Infinite loop?** Check karo har \`if/else\` branch mein koi pointer move ho raha hai ya nahi.
- **Edge cases:** empty array, ek element, do elements, sab same (\`[2, 2, 2]\`), answer bilkul pehle/aakhri pair mein, answer nahi.
- **Brute force se compare:** chhote random arrays pe O(n²) wala simple solution likho aur dono ke results match karo. Ye "stress testing" competitive programmers ka favourite trick hai.`,
          en: `- **Trace each step** with \`print(left, right, nums[left], nums[right], s)\`.
- **Dry-run on paper** with L and R arrows; interviewers like seeing this.
- **Infinite loop?** Ensure every branch moves a pointer.
- **Edge cases**: empty, one element, two elements, all equal, answer at the ends, no answer.
- **Stress test** against a simple O(n²) brute force on small random arrays.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Unsorted data + indices chahiye** (jaise Two Sum) → sort karne se original indices kho jaate hain. Hash map use karo: O(n) time, O(n) space.
- **Sorting ka cost** — data sorted nahi hai toh pehle O(n log n). Ek hi query ke liye hash set shayad better; bahut saari queries ya memory tight → sort + two pointers.
- **Monotonic rule zaroori** — "pointer kis taraf khiske" ka clear rule na ho (jaise random condition), toh two pointers kaam nahi karega.
- **Contiguous subarray** sawaal (sum of k consecutive) → ye **sliding window** hai, jo two pointers ka hi cousin hai.
- **Linked lists** pe bhi slow/fast pointers chalte hain — cycle detection (Floyd's), middle node.`,
          en: `- **Unsorted data where indices matter** (Two Sum): sorting loses indices, so use a hash map.
- **Sorting cost**: O(n log n) first; for one query a hash set may be better, for many queries or tight memory sort plus two pointers wins.
- **You need a monotonic move rule**; without one the technique fails.
- **Contiguous subarray problems** use **sliding window**, a close cousin.
- **Linked lists** use slow/fast pointers for cycle detection and finding the middle.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `**Do servers ke chat logs merge karna.** Ek chat app ke do servers apne-apne messages **timestamp ke order** mein save karte hain. Support team ko ek combined timeline chahiye.

\`\`\`python
def merge_logs(a, b):            # a, b sorted by timestamp
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i]["ts"] <= b[j]["ts"]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    return out + a[i:] + b[j:]
\`\`\`

Dono lists ko jod ke \`sort\` karte toh O((n+m) log(n+m)). Two pointers se **O(n + m)** — aur ye streaming mein bhi chalta hai (files line-by-line padh ke), poora data memory mein laaye bina. Bade log files ke liye yahi farq important hai.`,
          en: `**Merging chat logs from two servers.** Each server stores messages sorted by timestamp, and support needs one combined timeline.

\`\`\`python
def merge_logs(a, b):            # both sorted by timestamp
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i]["ts"] <= b[j]["ts"]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    return out + a[i:] + b[j:]
\`\`\`

Concatenating and sorting is O((n+m) log(n+m)); two pointers is **O(n + m)** and also works as a stream over huge files.`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "Pair sum on [1, 3, 4, 6, 8, 11], target 10",
      steps: [
        {
          title: "L = 0, R = 5",
          description: "1 + 11 = 12 > 10. 11 is too big even with the smallest number, so move R left.",
          highlight: "[L1, 3, 4, 6, 8, R11] sum 12",
        },
        {
          title: "L = 0, R = 4",
          description: "1 + 8 = 9 < 10. 1 is too small even with the biggest remaining number, so move L right.",
          highlight: "[L1, 3, 4, 6, R8, 11] sum 9",
        },
        {
          title: "L = 1, R = 4",
          description: "3 + 8 = 11 > 10. Move R left.",
          highlight: "[1, L3, 4, 6, R8, 11] sum 11",
        },
        {
          title: "L = 1, R = 3",
          description: "3 + 6 = 9 < 10. Move L right.",
          highlight: "[1, L3, 4, R6, 8, 11] sum 9",
        },
        {
          title: "L = 2, R = 3",
          description: "4 + 6 = 10. Found the pair (4, 6) in 5 steps instead of checking all 15 pairs.",
          highlight: "[1, 3, L4, R6, 8, 11] sum 10 ✓",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Opposite-end two pointers for 'find a pair with sum = target' requires the array to be...",
        options: ["Sorted", "Of even length", "Free of negative numbers", "Stored in a linked list"],
        correct: [0],
        explanation: "Pointer move ka rule (sum zyada → right ghatao) sirf sorted array pe sahi hai.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "In sorted pair-sum, the current sum is LESS than the target. What should you do?",
        options: [
          "Move right pointer left",
          "Move left pointer right",
          "Move both pointers",
          "Stop; no answer exists",
        ],
        correct: [1],
        explanation: "Sum badhana hai → bada number chahiye → left pointer aage (right side) khiskao.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the time complexity of two-pointer pair sum on a sorted array of size n?",
        options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"],
        correct: [2],
        explanation: "Har step mein ek pointer move hota hai aur range ek chhoti hoti hai → max n steps → O(n). Extra space O(1).",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which problems are commonly solved with two pointers?",
        options: [
          "Check if a string is a palindrome",
          "Pair with given sum in a sorted array",
          "Remove duplicates from a sorted array in place",
          "Shortest path in a graph",
        ],
        correct: [0, 1, 2],
        explanation: "Palindrome, sorted pair sum aur sorted array se duplicates hatana — teeno classic two-pointer problems. Graph shortest path ke liye BFS/Dijkstra chahiye.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `s = "racecar"
lo, hi = 0, len(s) - 1
steps = 0
while lo < hi and s[lo] == s[hi]:
    lo += 1
    hi -= 1
    steps += 1
print(steps, lo, hi)`,
        codeLanguage: "python",
        options: ["3 3 3", "4 4 2", "3 4 2", "7 0 6"],
        correct: [0],
        explanation: "r=r → (1,5), a=a → (2,4), c=c → (3,3). Ab lo < hi False, loop ruk gaya. steps = 3, lo = hi = 3.",
      },
      {
        type: "SPOT_BUG",
        difficulty: 2,
        prompt: "This function should return true if a sorted array has a pair with the given sum. What is the bug?",
        code: `function hasPair(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const sum = nums[lo] + nums[hi];
    if (sum === target) return true;
    if (sum < target) hi--;
    else lo++;
  }
  return false;
}`,
        codeLanguage: "javascript",
        options: [
          "The loop should be while (lo <= hi)",
          "The pointer moves are swapped: sum < target should do lo++, otherwise hi--",
          "hi should start at nums.length",
          "It should use == instead of ===",
        ],
        correct: [1],
        explanation: "Pointer directions ulte hain. Sum kam ho toh `lo++` (bada number lao), zyada ho toh `hi--`. Abhi code sahi pair ke paas se door bhaag jaata hai.",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "You get an UNSORTED array and must return the original indices of two numbers that add up to a target. Which approach fits best?",
        options: [
          "Sort, then use two pointers and return their positions",
          "Use a hash map from value to index in one pass",
          "Binary search for each element",
          "Two pointers directly on the unsorted array",
        ],
        correct: [1],
        explanation: "Sort karne se original indices kho jaate hain (ya alag se track karne padte hain). Hash map ek pass mein O(n) mein indices de deta hai.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 1,
        prompt: "Order the steps of the sorted pair-sum two-pointer algorithm.",
        options: [
          "Set left = 0 and right = n − 1",
          "Compute sum = nums[left] + nums[right]",
          "If sum equals target, return the pair",
          "If sum < target move left right, else move right left; repeat while left < right",
        ],
        explanation: "Pointers set karo, sum nikalo, match pe return, warna sum ke hisaab se ek pointer move — repeat jab tak left < right.",
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why does the two-pointer approach on a sorted array never skip the correct pair?",
        keywords: ["sorted", "discard", "too big", "too small", "invariant"],
        explanation: "Sorted hone ki wajah se: sum bahut bada hai toh right wala element sabse chhote bache element ke saath bhi zyada hai — wo kisi pair mein nahi aa sakta, discard safe. Sum chhota hai toh left wala sabse bade ke saath bhi kam — discard safe. Har discard sahi hai, toh answer kabhi nahi chhut ta.",
      },
    ],
    buildTask: {
      title: "Valid palindrome",
      description: `Function \`isPalindrome(s)\` likho jo check kare ki string **palindrome** hai ya nahi — sirf **letters aur digits** dekhte hue, aur **case ignore** karke.

- Spaces, commas, colons, apostrophes jaise characters ignore karo.
- \`"A man, a plan, a canal: Panama"\` → \`true\`
- Empty string → \`true\`.
- Two pointers use karo: ek left se, ek right se, non-alphanumeric characters skip karte hue. **O(n) time, O(1) extra space** target karo.`,
      functionName: "isPalindrome",
      starterJs: `function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  // TODO: skip non-alphanumeric characters, compare lowercase
  return true;
}`,
      starterPython: `def isPalindrome(s):
    left, right = 0, len(s) - 1
    # TODO: skip non-alphanumeric characters, compare lowercase
    return True`,
      tests: [
        {
          name: "simple word",
          args: ["racecar"],
          expected: true,
        },
        {
          name: "famous sentence",
          args: ["A man, a plan, a canal: Panama"],
          expected: true,
        },
        {
          name: "not a palindrome",
          args: ["hello"],
          expected: false,
        },
        {
          name: "empty string",
          args: [""],
          expected: true,
        },
        {
          name: "two different letters",
          args: ["ab"],
          expected: false,
        },
        {
          name: "apostrophes and case",
          args: ["No 'x' in Nixon"],
          expected: true,
          hidden: true,
        },
        {
          name: "digit and letter",
          args: ["0P"],
          expected: false,
          hidden: true,
        },
      ],
      hints: [
        "Dono siron se chalo. Jo character letter/digit nahi hai use skip karo. Baaki characters lowercase karke compare karo — ek bhi mismatch → false.",
        "Step 1: while left < right. Step 2: jab tak s[left] alphanumeric nahi, left++ (aur left < right rakho); same right ke liye. Step 3: lowercase compare; alag → false. Step 4: left++, right--.",
        `while left < right:
    if not s[left].isalnum():
        left += 1
        continue
    if not s[right].isalnum():
        right -= 1
        continue
    # compare s[left].lower() and s[right].lower()`,
      ],
      explainQuestions: [
        {
          question: "What is the time and space complexity of your solution?",
          keywords: ["o(n) time", "o(1) space", "each character once"],
        },
        {
          question: "How do you handle characters that are not letters or digits?",
          keywords: ["skip", "isalnum", "move pointer"],
        },
        {
          question: "Why is two pointers better here than building a cleaned, reversed copy?",
          keywords: ["extra memory", "copy", "o(1) space", "in place"],
        },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "Explain the two-pointer technique with an example.",
        short: "Two pointers keeps two indices into an array and moves them according to a rule, so you avoid checking every pair. For example, to find two numbers in a sorted array that sum to a target, start one pointer at each end; if the sum is too big move the right pointer left, if too small move the left pointer right. Each step discards one element, so it runs in O(n) time and O(1) space.",
        deep: `- **Opposite ends**: pair sum, palindromes, container with most water, 3Sum (fix one element, two-pointer the rest, O(n²)).
- **Same direction**: remove duplicates in place, partitioning, merging sorted arrays.
- **Fast/slow on linked lists**: Floyd's cycle detection, finding the middle.
- Correctness comes from an invariant: the answer, if it exists, stays inside the current window.`,
        followUps: [
          "How would you solve 3Sum?",
          "How do you detect a cycle in a linked list?",
          "When would you prefer a hash map?",
        ],
        commonMistake: "Applying the opposite-end move rule to an unsorted array.",
        keywords: ["two indices", "sorted", "discard", "o(n)", "o(1) space"],
        difficulty: 2,
        roles: ["SDE", "BACKEND", "FRONTEND"],
      },
      {
        question: "Two pointers or hash map for Two Sum, how do you decide?",
        short: "If the array is unsorted and I need original indices, I use a hash map: O(n) time and O(n) space. If the array is already sorted, or I only need the values, two pointers gives O(n) time with O(1) extra space. If it is unsorted but memory is tight, sorting plus two pointers costs O(n log n) time.",
        deep: `- Hash map: one pass, keeps indices, extra memory.
- Two pointers: needs sorted input, constant memory, also extends neatly to 3Sum and 4Sum with duplicate skipping.
- Mention the trade-off explicitly; interviewers look for that reasoning.`,
        followUps: [
          "What changes for 3Sum?",
          "How do you handle duplicates?",
          "What if the input is a stream?",
        ],
        commonMistake: "Sorting an array to use two pointers and then returning indices of the sorted array instead of the original.",
        keywords: ["sorted", "indices", "space", "o(n log n)", "trade-off"],
        difficulty: 2,
        roles: ["SDE"],
      },
    ],
  },
  {
    slug: "sliding-window",
    estMinutes: 50,
    difficulty: 2,
    prerequisites: ["two-pointers"],
    objectives: [
      "Recognise problems about contiguous subarrays or substrings",
      "Implement a fixed-size window that updates in O(1) per slide",
      "Implement a variable-size window that expands and shrinks with two pointers",
      "Explain why a variable window is O(n) even with a nested while loop",
    ],
    technicalDefinition: "The sliding-window technique maintains a contiguous range [left, right] over a sequence together with incrementally updated state, adding the element that enters and removing the one that leaves, so that all windows are processed in O(n) total time.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Sliding window** ek pattern hai **lagatar (contiguous) tukdon** ke sawaalon ke liye — subarray ya substring.

Har window ka kaam shuru se dobara karne ki jagah, window ko **ek kadam slide** karo: jo element andar aaya use **jodo**, jo bahar gaya use **hatao**.

Do type:
- **Fixed size (k):** "k consecutive elements ka max sum" — window hamesha k ki.
- **Variable size:** "longest substring without repeating characters" — \`right\` se window badhao, condition toote toh \`left\` se chhoti karo.

Result: O(n·k) ya O(n²) → **O(n)**.`,
          en: `**Sliding window** is a pattern for problems about **contiguous** pieces: subarrays or substrings.

Instead of recomputing each window from scratch, **slide** it one step: **add** the element that enters and **remove** the one that leaves.

Two kinds:
- **Fixed size k**, e.g. "maximum sum of k consecutive elements".
- **Variable size**, e.g. "longest substring without repeating characters": grow with \`right\`, shrink with \`left\` when a rule breaks.

This turns O(n·k) or O(n²) into **O(n)**.`,
          hi: `**स्लाइडिंग विंडो** एक पैटर्न है **लगातार (contiguous) हिस्सों** वाले सवालों के लिए — सबऐरे या सबस्ट्रिंग।

हर विंडो का हिसाब शुरू से करने के बजाय विंडो को **एक कदम खिसकाओ**: जो एलिमेंट अंदर आया उसे **जोड़ो**, जो बाहर गया उसे **घटाओ**।

दो प्रकार:
- **फ़िक्स्ड साइज़ (k):** "k लगातार एलिमेंट्स का अधिकतम योग"।
- **वेरिएबल साइज़:** \`right\` से विंडो बढ़ाओ, शर्त टूटे तो \`left\` से छोटी करो।

नतीजा: O(n·k) से **O(n)**।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Cricket commentary yaad karo: **"Pichhle 5 overs mein 52 runs aaye hain."**

Commentator har over ke baad pichhle 5 overs ke runs **dobara se nahi jodta**. Wo smart hai:
- Naya over khatam hua (12 runs) → total mein **+12**.
- Jo over ab "pichhle 5" se bahar ho gaya (6 runs) → total se **−6**.
- Naya total ek second mein tayyar.

Yahi **fixed sliding window** hai — window = last 5 overs, har slide pe ek add, ek remove.

**Variable window** ka example: "Sabse lamba spell jisme koi wicket nahi gira." Overs jodte jao (right badhao). Wicket gira? Spell wahan se dobara shuru — purane overs chhod do (left aage). Har over sirf ek baar andar aata hai aur ek baar bahar jaata hai.`,
          en: `Cricket commentary: **"52 runs in the last 5 overs."**

The commentator does not re-add five overs every time:
- A new over finishes with 12 runs: **+12**.
- The over that drops out of the last five had 6 runs: **−6**.
- The new total is ready instantly.

That is a **fixed sliding window**: one add and one remove per slide.

A **variable window** is "the longest spell without a wicket": keep adding overs; when a wicket falls, drop the old overs and restart from there. Each over enters once and leaves once.`,
          hi: `क्रिकेट कमेंट्री याद कीजिए: **"पिछले 5 ओवर में 52 रन आए हैं।"**

कमेंटेटर हर ओवर के बाद पिछले 5 ओवर के रन **दोबारा नहीं जोड़ता**:
- नया ओवर (12 रन) → कुल में **+12**।
- जो ओवर अब "पिछले 5" से बाहर हुआ (6 रन) → कुल से **−6**।

यही **फ़िक्स्ड स्लाइडिंग विंडो** है — हर बार एक जोड़ो, एक घटाओ।

**वेरिएबल विंडो** का उदाहरण: "बिना विकेट गिरे सबसे लंबा स्पेल।" ओवर जोड़ते जाओ; विकेट गिरा तो पुराने ओवर छोड़ दो। हर ओवर एक बार अंदर आता है और एक बार बाहर जाता है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Sawaal: "10 lakh daily orders ki list hai, kis **7 din** ke stretch mein sabse zyada orders aaye?"

Brute force: har starting din se 7 din jodo → n × 7 operations. k = 7 chhota hai toh chal jaayega, par agar k = 1 lakh ho? n × k = **10¹¹** — ghanton ka kaam.

Sliding window: pehli window ka sum ek baar, phir har slide pe **+naya −purana** → total **O(n)**, k chahe kitna bhi bada ho.

Variable window wale sawaal (longest substring without repeats, smallest subarray with sum ≥ S) brute force mein O(n²) ya O(n³) hote hain. Window ke saath O(n). Isliye ye pattern interviews ka favourite hai — Amazon, Microsoft, Google ke string/array rounds mein bahut aata hai.`,
          en: `"Which 7-day stretch had the most orders?" Brute force adds 7 days for each start: n × k work. With k = 1 lakh and n = 10 lakh that is 10¹¹ operations.

A sliding window computes the first sum once, then does **+new −old** per slide: **O(n)** regardless of k.

Variable-window problems like longest substring without repeats or smallest subarray with sum ≥ S are O(n²) or worse by brute force and O(n) with a window, which is why interviewers love this pattern.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Rate limiting (Cloudflare)** — Cloudflare ne apne engineering blog mein bataya hai ki unka rate limiting **sliding window** approximation pe chalta hai: "pichhle 60 second mein is IP se kitni requests aayi?" — fixed minute boundaries se zyada accurate.
- **TCP flow control** — internet ka TCP protocol ek **sliding window** use karta hai: sender ek baar mein kitna data bina acknowledgement ke bhej sakta hai, aur ACK aate hi window aage slide hoti hai.
- **Stock charts (Zerodha Kite, TradingView)** — **Moving Average** indicator (jaise 20-day MA) har din pichhle 20 din ka average dikhata hai — ek fixed-size sliding window, naya din add, sabse purana remove.`,
          en: `- **Rate limiting at Cloudflare**: their engineering blog describes a sliding-window approximation for counting requests from a client over the last 60 seconds, more accurate than fixed minute buckets.
- **TCP flow control** uses a **sliding window** of unacknowledged data that moves forward as ACKs arrive.
- **Stock charts** in Zerodha Kite or TradingView show **moving averages** (e.g. 20-day MA): a fixed window adding the newest day and dropping the oldest.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `**Fixed window (size k):**
1. Pehle k elements ka sum = \`window\`. \`best = window\`.
2. \`right\` ko k se n−1 tak chalao: \`window += nums[right] − nums[right − k]\`.
3. Har baar \`best\` update. Har step O(1) → total O(n).

**Variable window** (template):
\`\`\`
left = 0
for right in range(n):
    add nums[right] to state
    while window is invalid:
        remove nums[left] from state
        left += 1
    update answer with window [left, right]
\`\`\`
\`while\` andar hai, phir bhi **O(n)**: \`left\` poore run mein sirf aage badhta hai, max n baar. Har element ek baar add, ek baar remove → **amortized O(n)**.

**State** problem pe depend karti hai: sum, count, ya hash map (characters ki frequency / last seen index).`,
          en: `**Fixed window of size k**:
1. Sum the first k elements into \`window\`; \`best = window\`.
2. For \`right\` from k to n−1: \`window += nums[right] − nums[right − k]\`.
3. Update \`best\` each time; O(1) per step, O(n) total.

**Variable window**: for each \`right\`, add the element to the state; while the window is invalid, remove \`nums[left]\` and advance \`left\`; then update the answer.

Despite the inner \`while\`, it is **O(n)**: \`left\` only moves forward, at most n times overall, so each element is added once and removed once. The state can be a sum, a count or a hash map.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Do classic problems:

- \`max_sum_subarray(nums, k)\` — **fixed window**. Pehli window ka sum, phir har slide pe \`+ nums[r] − nums[r − k]\`. Invalid k pe 0.
- \`longest_unique(s)\` — **variable window**. \`last_seen\` dict har character ka aakhri index rakhta hai. Repeat mila jo window ke andar hai → \`left\` ko uske aage le jao. Har step pe \`right − left + 1\` se length.

**Complexity:**
- max_sum_subarray: **O(n) time, O(1) space**.
- longest_unique: **O(n) time, O(min(n, alphabet)) space** (dict).

Brute force dono mein O(n·k) / O(n²) hota.`,
          en: `Two classic problems:

- \`max_sum_subarray(nums, k)\`: a **fixed window**. Sum the first window, then add \`nums[r] − nums[r − k]\` per slide; invalid k returns 0.
- \`longest_unique(s)\`: a **variable window**. \`last_seen\` stores each character's latest index; on a repeat inside the window, jump \`left\` past it. Length is \`right − left + 1\`.

**Complexity**: the first is O(n) time and O(1) space; the second is O(n) time and O(min(n, alphabet)) space. Brute force would be O(n·k) or O(n²).`,
        },
        codeJs: `function maxSumSubarray(nums, k) {
  if (k <= 0 || k > nums.length) return 0;
  let window = 0;
  for (let i = 0; i < k; i++) window += nums[i];
  let best = window;
  for (let r = k; r < nums.length; r++) {
    window += nums[r] - nums[r - k];
    best = Math.max(best, window);
  }
  return best;
}

function longestUnique(s) {
  const lastSeen = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) left = lastSeen.get(ch) + 1;
    lastSeen.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}

const dailyOrders = [2, 1, 5, 1, 3, 2];
console.log(maxSumSubarray(dailyOrders, 3));
console.log(maxSumSubarray([1, 2], 5));
console.log(longestUnique("abcabcbb"), longestUnique("pwwkew"), longestUnique(""));`,
        codePython: `def max_sum_subarray(nums, k):
    if k <= 0 or k > len(nums):
        return 0
    window = sum(nums[:k])
    best = window
    for r in range(k, len(nums)):
        window += nums[r] - nums[r - k]
        best = max(best, window)
    return best

def longest_unique(s):
    last_seen = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best

daily_orders = [2, 1, 5, 1, 3, 2]
print(max_sum_subarray(daily_orders, 3))
print(max_sum_subarray([1, 2], 5))
print(longest_unique("abcabcbb"), longest_unique("pwwkew"), longest_unique(""))`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **Purana element hatana bhool gaye** — \`window += nums[r]\` likha, \`− nums[r − k]\` nahi. Ab ye window nahi, prefix sum ban gaya.
2. **Off-by-one** — window size \`right − left + 1\` hai, \`right − left\` nahi. Aur fixed window mein outgoing element \`nums[r − k]\` hai.
3. **Non-contiguous problem pe window** — "koi bhi k elements chuno" (subsequence/subset) sliding window ka sawaal nahi hai.
4. **Negative numbers wale variable window** — "smallest subarray with sum ≥ S" ka shrink logic tab kaam karta hai jab sab numbers positive hon. Negatives ke saath prefix sum + hash map / deque chahiye.
5. **\`last_seen[ch] >= left\` check bhoolna** — purana occurrence jo window ke bahar hai, uspe left ko **peeche** le jaoge → galat answer.
6. **k > n** case handle na karna → crash ya garbage.`,
          en: `1. **Forgetting to remove the outgoing element** (\`− nums[r − k]\`).
2. **Off-by-one**: window length is \`right − left + 1\`.
3. **Using a window for non-contiguous choices** like subsets.
4. **Variable windows with negative numbers**: the shrink rule for "sum ≥ S" assumes positives; use prefix sums or a deque otherwise.
5. **Missing the \`last_seen[ch] >= left\` check**, which can move \`left\` backwards.
6. **Not handling k > n.**`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `- **Window print karo:** har step pe \`print(left, right, nums[left:right + 1], window_sum)\`. Asli window aur tumhara tracked sum match ho raha hai? Nahi → add/remove mein galti.
- **Assert lagao (sirf debugging mein):** \`assert window_sum == sum(nums[left:right + 1])\` — jis step pe toota, wahi bug.
- **Pehli window alag se check karo** — zyada tar bugs initial window banate waqt hote hain.
- **Edge cases:** k = 1, k = n, k > n, empty array, sab negative numbers (best ko 0 se initialise kiya toh galat!), string mein sab same characters (\`"aaaa"\` → 1).
- **Brute force se match:** chhote inputs pe O(n·k) wala simple version likho aur results compare karo.`,
          en: `- **Print the window** each step: \`print(left, right, nums[left:right + 1], window_sum)\`.
- **Assert while debugging**: \`assert window_sum == sum(nums[left:right + 1])\`.
- **Check the first window separately**; many bugs live there.
- **Edge cases**: k = 1, k = n, k > n, empty input, all negatives (do not start \`best\` at 0), all-same strings.
- **Compare with brute force** on small inputs.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Sirf contiguous** ke liye. Subsets / subsequences → DP ya backtracking.
- **Negative numbers + sum condition** → window ka shrink rule toot jaata hai. **Prefix sum + hash map** use karo (jaise "subarray sum equals k").
- **Window ka max/min chahiye** (sum nahi) → simple variable kaafi nahi; **monotonic deque** lagta hai (sliding window maximum), ya heap.
- **Bahut saari alag-alag range queries** ("index 5 se 900 ka sum", "20 se 70 ka sum"...) → har query ke liye window nahi, ek baar **prefix sum** array banao, phir har query O(1).
- Window ki state (hash map) memory leti hai — alphabet chhota hai toh 26-size array fast aur halka.`,
          en: `- **Contiguous only**; subsets and subsequences need DP or backtracking.
- **Negative numbers with sum conditions** break the shrink rule; use **prefix sums with a hash map**.
- **Window max/min** needs a **monotonic deque** or a heap.
- **Many arbitrary range queries** are better served by a **prefix sum** array with O(1) per query.
- For small alphabets, a 26-slot array is lighter than a hash map for window state.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `**API rate limiter: "ek user 60 second mein max 100 requests."**

\`\`\`python
from collections import deque

class RateLimiter:
    def __init__(self, limit=100, window_s=60):
        self.limit, self.window_s = limit, window_s
        self.hits = {}                       # user_id -> deque of timestamps

    def allow(self, user_id, now):
        q = self.hits.setdefault(user_id, deque())
        while q and q[0] <= now - self.window_s:  # shrink: old hits leave
            q.popleft()
        if len(q) >= self.limit:
            return False
        q.append(now)                        # expand: new hit enters
        return True
\`\`\`

Ye **sliding window log** hai — har user ki window pichhle 60 second ki requests. Purane timestamps left se nikalte hain, naye right se aate hain; har request ek baar add, ek baar remove → amortized O(1). Production mein yahi idea Redis sorted sets ke saath multiple servers pe chalta hai.`,
          en: `**An API rate limiter: at most 100 requests per user per 60 seconds.**

\`\`\`python
from collections import deque

class RateLimiter:
    def __init__(self, limit=100, window_s=60):
        self.limit, self.window_s = limit, window_s
        self.hits = {}                       # user_id -> deque of timestamps

    def allow(self, user_id, now):
        q = self.hits.setdefault(user_id, deque())
        while q and q[0] <= now - self.window_s:
            q.popleft()
        if len(q) >= self.limit:
            return False
        q.append(now)
        return True
\`\`\`

This **sliding window log** drops old timestamps on the left and adds new ones on the right, amortized O(1) per request. In production the same idea runs on Redis sorted sets across servers.`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "Fixed window, k = 3, on [2, 1, 5, 1, 3, 2]",
      steps: [
        {
          title: "First window",
          description: "Sum the first 3 elements once: 2 + 1 + 5 = 8. best = 8.",
          highlight: "[2 1 5] 1 3 2 → 8",
        },
        {
          title: "Slide 1",
          description: "1 enters, 2 leaves: 8 + 1 − 2 = 7. best stays 8.",
          highlight: "2 [1 5 1] 3 2 → 7",
        },
        {
          title: "Slide 2",
          description: "3 enters, 1 leaves: 7 + 3 − 1 = 9. best = 9.",
          highlight: "2 1 [5 1 3] 2 → 9",
        },
        {
          title: "Slide 3",
          description: "2 enters, 5 leaves: 9 + 2 − 5 = 6. best stays 9.",
          highlight: "2 1 5 [1 3 2] → 6",
        },
        {
          title: "Done",
          description: "4 windows processed with one add and one remove each: O(n), not O(n·k). Answer 9.",
          highlight: "max = 9",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Sliding window is designed for problems about...",
        options: [
          "Contiguous subarrays or substrings",
          "Any subset of elements",
          "Tree traversals",
          "Sorting an array",
        ],
        correct: [0],
        explanation: "Window hamesha lagatar (contiguous) elements ka hota hai — subarray ya substring. Subsets ke liye nahi.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "A fixed window of size k slides one step. How is the new sum computed efficiently?",
        options: [
          "Re-add all k elements",
          "old sum + incoming element − outgoing element",
          "old sum × 2 − k",
          "Sort the window and add",
        ],
        correct: [1],
        explanation: "Naya element jodo, jo bahar gaya use ghatao — O(1) per slide.",
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "What is the time complexity of the fixed-size sliding-window maximum-sum algorithm for n elements?",
        options: ["O(n·k)", "O(n)", "O(k)", "O(n log n)"],
        correct: [1],
        explanation: "Pehli window O(k), phir n − k slides, har ek O(1) → O(n) total.",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which problems are a good fit for sliding window?",
        options: [
          "Maximum sum of any k consecutive elements",
          "Longest substring without repeating characters",
          "Number of subsets that sum to k",
          "Moving average of orders over the last 7 days",
        ],
        correct: [0, 1, 3],
        explanation: "Max sum of k consecutive, longest substring without repeats aur last 7 days ka moving average — sab contiguous. Subsets summing to k contiguous nahi hain.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `nums = [4, 2, 1, 7, 8, 1, 2, 8, 1, 0]
k = 3
window = sum(nums[:k])
best = window
for r in range(k, len(nums)):
    window += nums[r] - nums[r - k]
    best = max(best, window)
print(best)`,
        codeLanguage: "python",
        options: ["11", "16", "17", "34"],
        correct: [1],
        explanation: "Windows: 7, 10, 16, 16, 11, 11, 11, 9. Maximum 16 (1+7+8 aur 7+8+1).",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 3,
        prompt: "What does this JavaScript code print?",
        code: `function longestUnique(s) {
  const last = new Map();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (last.has(ch) && last.get(ch) >= left) left = last.get(ch) + 1;
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
console.log(longestUnique("chaichai"), longestUnique("aaaa"));`,
        codeLanguage: "javascript",
        options: ["4 1", "8 1", "4 4", "3 1"],
        correct: [0],
        explanation: "\"chaichai\": c-h-a-i (4 unique), phir 'c' repeat → left aage, window phir bhi max 4. \"aaaa\": har baar repeat → length 1.",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "A delivery dashboard must show the average delivery time of the last 30 orders and update after every new order. What is the best approach?",
        options: [
          "Recompute the sum of the last 30 orders from scratch every time",
          "Keep a running sum over a fixed window of 30 using a queue: add the new order, subtract the oldest",
          "Average all orders of the day",
          "Sort the orders by time and take the median",
        ],
        correct: [1],
        explanation: "Fixed window of 30: running sum rakho, naya order jodo, 31st-purana ghatao (queue/deque se). Har update O(1). Har baar 30 ko dobara jodna kaam karega par wasteful hai; poore din ka average galat metric hai.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps of the fixed-size sliding-window maximum-sum algorithm.",
        options: [
          "Compute the sum of the first k elements",
          "Set best to that sum",
          "For each next index r, add nums[r] and subtract nums[r − k]",
          "Update best after each slide and return it at the end",
        ],
        explanation: "Pehli window ka sum, best set karo, phir har slide pe update aur best compare, end mein return.",
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "A variable-size window has a while loop inside a for loop. Why is it still O(n)?",
        keywords: ["each element", "added once", "removed once", "left only moves forward", "amortized"],
        explanation: "`right` n baar aage badhta hai, aur `left` bhi poore run mein sirf aage badhta hai — max n baar total. Har element ek baar window mein aata hai aur ek baar nikalta hai, toh total kaam ~2n = O(n) (amortized).",
      },
    ],
    buildTask: {
      title: "Maximum sum of k consecutive elements",
      description: `Function \`maxSumSubarray(nums, k)\` likho jo **k lagatar elements** ka **maximum sum** return kare.

- Agar \`k <= 0\` ya \`k > nums.length\` → \`0\` return karo.
- Numbers negative bhi ho sakte hain (dhyaan: best ko 0 se shuru mat karna!).
- **O(n)** chahiye — sliding window. Har window ko dobara jodna (O(n·k)) nahi.

Example: \`maxSumSubarray([2, 1, 5, 1, 3, 2], 3)\` → \`9\` (window \`[5, 1, 3]\`)`,
      functionName: "maxSumSubarray",
      starterJs: `function maxSumSubarray(nums, k) {
  if (k <= 0 || k > nums.length) return 0;
  // TODO: sum the first window, then slide
}`,
      starterPython: `def maxSumSubarray(nums, k):
    if k <= 0 or k > len(nums):
        return 0
    # TODO: sum the first window, then slide`,
      tests: [
        {
          name: "example",
          args: [
            [2, 1, 5, 1, 3, 2],
            3,
          ],
          expected: 9,
        },
        {
          name: "k = 2",
          args: [
            [1, 2, 3, 4, 5],
            2,
          ],
          expected: 9,
        },
        {
          name: "single element",
          args: [
            [5],
            1,
          ],
          expected: 5,
        },
        {
          name: "all negative",
          args: [
            [-1, -2, -3, -4],
            2,
          ],
          expected: -3,
        },
        {
          name: "k larger than array",
          args: [
            [1, 2],
            3,
          ],
          expected: 0,
        },
        {
          name: "longer array",
          args: [
            [4, 2, 1, 7, 8, 1, 2, 8, 1, 0],
            3,
          ],
          expected: 16,
          hidden: true,
        },
        {
          name: "mixed signs",
          args: [
            [3, -1, 4, -1, 5, -9, 2, 6],
            4,
          ],
          expected: 7,
          hidden: true,
        },
      ],
      hints: [
        "Har window ko shuru se mat jodo. Pehli window ka sum ek baar nikalo, phir har slide pe ek element jodo aur ek ghatao.",
        "Step 1: window = sum of nums[0..k-1], best = window. Step 2: r = k se end tak: window += nums[r] − nums[r − k]. Step 3: best = max(best, window). Step 4: best return.",
        `window = sum(nums[:k])
best = window
for r in range(k, len(nums)):
    window += nums[r] - nums[r - k]
    # update best`,
      ],
      explainQuestions: [
        {
          question: "What is the time and space complexity, and why not O(n·k)?",
          keywords: ["o(n)", "o(1) space", "add one", "remove one"],
        },
        {
          question: "Why should best not start at 0?",
          keywords: ["negative", "first window", "all negative"],
        },
        {
          question: "Which element leaves the window when index r enters?",
          keywords: ["r - k", "outgoing", "left end"],
        },
      ],
      estMinutes: 18,
    },
    interview: [
      {
        question: "What is the sliding window technique?",
        short: "Sliding window processes contiguous subarrays or substrings by keeping a window with two indices and updating its state incrementally: add the element entering on the right, remove the one leaving on the left. Fixed windows handle problems like maximum sum of k elements; variable windows expand and shrink for problems like the longest substring without repeating characters. Both run in O(n).",
        deep: `- **Fixed**: \`window += a[r] - a[r - k]\`.
- **Variable template**: for each right, add; while invalid, remove left and advance; update the answer.
- **Complexity**: each element enters and leaves at most once, so O(n) amortized.
- **Signals in a problem statement**: "contiguous", "substring", "subarray", "at most k distinct", "longest/shortest window".`,
        followUps: [
          "Solve longest substring without repeating characters.",
          "How do you find the maximum in every window of size k?",
          "What breaks when numbers can be negative?",
        ],
        commonMistake: "Using a sliding window for subset or subsequence problems, which are not contiguous.",
        keywords: ["contiguous", "add and remove", "fixed", "variable", "o(n)"],
        difficulty: 2,
        roles: ["SDE", "BACKEND", "FRONTEND"],
      },
      {
        question: "Solve 'longest substring without repeating characters' and give its complexity.",
        short: "I keep a window [left, right] and a map from character to its last index. For each right, if the character was seen at an index inside the window, I move left to one past that index. Then I record the index and update the best length as right minus left plus one. It is O(n) time and O(min(n, alphabet size)) space.",
        deep: `\`\`\`python
def longest_unique(s):
    last, left, best = {}, 0, 0
    for right, ch in enumerate(s):
        if last.get(ch, -1) >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best
\`\`\`
The \`>= left\` check matters: an old occurrence outside the window must not pull \`left\` backwards.`,
        followUps: [
          "How would you return the substring itself?",
          "What if at most k repeats are allowed?",
          "Can you do it with a fixed-size array instead of a map?",
        ],
        commonMistake: "Forgetting the `>= left` check, which moves the left pointer backwards on stale indices.",
        keywords: ["last seen index", "move left", "window length", "o(n)", "hash map"],
        difficulty: 3,
        roles: ["SDE"],
      },
    ],
    promptCard: {
      title: "Spot the pattern: is this a sliding window problem?",
      category: "INTERVIEW",
      task: "Have an AI coach you, Socratically, into recognising whether a DSA problem fits the sliding window pattern and how to set up the window.",
      whenToUse: "When you are practising DSA and are stuck on a new array or string problem, before looking at the solution.",
      template: `You are my DSA interview coach. Do not give me the solution code.

Problem:
[PROBLEM_STATEMENT]

Constraints: [CONSTRAINTS]
My current idea: [MY_IDEA]

Coach me step by step:
1. Ask me whether the problem is about a contiguous subarray/substring, and wait for my answer.
2. Help me decide: fixed-size window or variable-size window?
3. Ask what state I need to track inside the window (sum, count, hash map...).
4. Ask when the window becomes invalid and how I shrink it.
5. Only after I answer, confirm the time and space complexity.
If sliding window is NOT the right pattern, tell me which pattern is and why.
Keep each message under 80 words.`,
      variables: [
        {
          key: "PROBLEM_STATEMENT",
          label: "The full problem statement",
        },
        {
          key: "CONSTRAINTS",
          label: "Input limits, e.g. 1 <= n <= 10^5, values can be negative",
        },
        {
          key: "MY_IDEA",
          label: "Your current approach or brute force, even if slow",
        },
      ],
      whyItWorks: [
        {
          part: "No solution code",
          why: "You build the pattern-recognition muscle that interviews actually test.",
        },
        {
          part: "Step-by-step questions",
          why: "Mirrors the real thinking order: contiguous? fixed or variable? state? shrink rule?",
        },
        {
          part: "Constraints including negatives",
          why: "Negative numbers often break sliding window, so the coach can redirect you to prefix sums.",
        },
        {
          part: "Short messages",
          why: "Keeps it a dialogue instead of a lecture you skim.",
        },
      ],
      verifyChecklist: [
        "After the session, write the code yourself without help.",
        "Test with edge cases: k = 1, k = n, empty input, all-same values.",
        "Compare your output with a brute-force version on small inputs.",
        "Confirm the complexity by checking that each element enters and leaves the window once.",
      ],
      sampleOutput: `Coach: Look at the problem again. Is the answer always made of elements that sit next to each other in the array?
You: Yes, it says "subarray".
Coach: Good, contiguous. Is the length fixed by the problem, or does it depend on a condition?
You: It must have sum >= S, length can vary.
Coach: So a variable window. What will you track as you move right, and when is the window "valid"?`,
    },
  },
  {
    slug: "binary-search",
    estMinutes: 50,
    difficulty: 2,
    prerequisites: ["big-o", "arrays-strings"],
    objectives: [
      "Implement iterative binary search with lo, mid and hi without off-by-one bugs",
      "Explain why binary search is O(log n) and when it applies",
      "Find the first position where a condition becomes true (lower bound)",
      "Recognise 'binary search on the answer' problems with a monotonic condition",
    ],
    technicalDefinition: "Binary search finds a target (or a boundary) in a sorted sequence, or over any monotonic predicate, by repeatedly comparing with the middle element and discarding the half that cannot contain the answer, taking O(log n) comparisons.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Binary search** sorted array mein kuch dhoondhne ka sabse smart tareeka hai: **beech wala element dekho, aur aadha hissa phenk do.**

- \`mid\` pe value target se **chhoti** hai → answer right half mein → \`lo = mid + 1\`.
- **Badi** hai → answer left half mein → \`hi = mid − 1\`.
- **Barabar** → mil gaya!

Har step mein search area **aadha** → 10 lakh elements mein bhi sirf **~20 steps**. Ye hai **O(log n)**.

Shart: data **sorted** ho (ya koi aisa condition ho jo ek point ke baad false se true ho jaaye — isse "monotonic" kehte hain).`,
          en: `**Binary search** is the smart way to search a sorted array: **look at the middle and throw away half.**

- Middle value smaller than the target: the answer is on the right, \`lo = mid + 1\`.
- Bigger: it is on the left, \`hi = mid − 1\`.
- Equal: found.

The search area halves every step, so 10 lakh elements need only **about 20 steps**: **O(log n)**.

The data must be **sorted**, or more generally the condition must flip from false to true at one point (**monotonic**).`,
          hi: `**बाइनरी सर्च** सॉर्टेड ऐरे में कुछ ढूँढने का सबसे समझदार तरीका है: **बीच वाला एलिमेंट देखो और आधा हिस्सा छोड़ दो।**

- बीच की वैल्यू लक्ष्य से **छोटी** है → उत्तर दाएँ आधे में → \`lo = mid + 1\`।
- **बड़ी** है → उत्तर बाएँ आधे में → \`hi = mid − 1\`।
- **बराबर** → मिल गया!

हर कदम पर खोज का क्षेत्र **आधा** → 10 लाख एलिमेंट्स में भी सिर्फ़ **~20 कदम**। यही **O(log n)** है।

शर्त: डेटा **सॉर्टेड** होना चाहिए।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Dost ke saath game khelo: **"1 se 100 ke beech ek number socho."**

Tum ek-ek karke poochoge — "1? 2? 3?" — toh 100 sawaal tak lag sakte hain. Smart tareeka:
- "50 se bada hai?" → "Haan." Ab 1–50 bekaar. Bache 51–100.
- "75 se bada?" → "Nahi." Bache 51–75.
- "63 se bada?" ... aur aise hi.

Har sawaal pe aadhe numbers out. **Max 7 sawaal** mein number mil jaayega, kyunki 2⁷ = 128 > 100.

Purane zamaane ki **Oxford dictionary** mein "pineapple" dhoondhna bhi yahi hai — beech se kholo, "p" aage hai ya peeche? Aadha band. Koi bhi page 1 se palatna shuru nahi karta. Kyun? Kyunki dictionary **sorted** hai!`,
          en: `Play "think of a number from 1 to 100".

Asking "1? 2? 3?" could take 100 questions. The smart way:
- "Bigger than 50?" Yes, so 1–50 are gone.
- "Bigger than 75?" No, so 51–75 remain.
- And so on.

Each question removes half the candidates, so **at most 7 questions** are needed because 2⁷ = 128 > 100.

Finding "pineapple" in a paper dictionary works the same way: open in the middle, decide which half, repeat. Nobody starts at page 1, because the dictionary is **sorted**.`,
          hi: `दोस्त के साथ खेल खेलिए: **"1 से 100 के बीच एक नंबर सोचो।"**

एक-एक करके पूछेंगे तो 100 सवाल लग सकते हैं। समझदार तरीका:
- "50 से बड़ा है?" → "हाँ।" अब 1–50 बेकार।
- "75 से बड़ा?" → "नहीं।" बचे 51–75।

हर सवाल पर आधे नंबर बाहर। **ज़्यादा से ज़्यादा 7 सवाल** में नंबर मिल जाएगा, क्योंकि 2⁷ = 128 > 100।

शब्दकोश में "pineapple" ढूँढना भी ऐसा ही है — बीच से खोलो और आधा छोड़ो। क्योंकि शब्दकोश **सॉर्टेड** है!`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Linear search (ek-ek karke) O(n) hai. Chhote data pe theek, par:

- 10 lakh items → linear: 10 lakh comparisons. Binary: **20**.
- 100 crore items → linear: 100 crore. Binary: **30**.

Ye fark "instant" aur "timeout" ka hai. Aur binary search sirf "array mein number dhoondho" tak simit nahi:
- **Pehla version jisme bug aaya** (first bad version).
- **Minimum capacity** jisme saare parcels D din mein ship ho jaayein.
- **Square root** ya koi bhi answer jo ek range mein hai aur "chalega / nahi chalega" ka clear boundary hai.

Interviews mein "binary search on answer" ek favourite trick hai — jahan sorted array dikhta bhi nahi, phir bhi binary search lagta hai.`,
          en: `Linear search is O(n). For 10 lakh items that is 10 lakh comparisons versus **20** for binary search; for 100 crore, **30**.

That is the difference between instant and a timeout. Binary search also solves more than "find a number":
- the **first bad version** of a program,
- the **minimum capacity** to ship all parcels within D days,
- a **square root** or any answer in a range with a clear works/does-not-work boundary.

"Binary search on the answer" is an interview favourite where no sorted array is visible at all.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **\`git bisect\`** — code mein bug kab aaya, pata nahi? \`git bisect\` commits ki history pe binary search karta hai: beech wala commit checkout, tum batao "good" ya "bad", aur aadhi history out. 1000 commits mein ~10 tests mein culprit commit mil jaata hai.
- **Database indexes (PostgreSQL B-tree)** — B-tree ke har page mein keys sorted hoti hain, aur page ke andar sahi key/child dhoondhne ke liye binary search hota hai. Isliye indexed lookup crore rows mein bhi fast hai.
- **Python ka \`bisect\` module / Java ka \`Arrays.binarySearch\`** — standard libraries mein ready-made binary search, sorted list mein insert position ya element dhoondhne ke liye.`,
          en: `- **\`git bisect\`** binary-searches your commit history: it checks out the middle commit, you mark it good or bad, and half the history is discarded. About 10 tests find the culprit among 1000 commits.
- **PostgreSQL B-tree indexes** keep keys sorted within each page and binary-search inside pages, so indexed lookups stay fast over crores of rows.
- **Python's \`bisect\` module and Java's \`Arrays.binarySearch\`** provide ready-made binary search for lookups and insert positions.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Standard template (exact match):

\`\`\`
lo, hi = 0, n - 1
while lo <= hi:
    mid = lo + (hi - lo) // 2
    if a[mid] == target: return mid
    if a[mid] < target: lo = mid + 1
    else: hi = mid - 1
return -1
\`\`\`

- **Invariant:** agar target hai, toh wo \`[lo, hi]\` ke andar hai. Har step pe ye range chhoti hoti hai.
- **\`lo <= hi\`** kyunki ek element wali range (\`lo == hi\`) bhi check karni hai.
- **\`mid + 1\` / \`mid − 1\`** — mid already check ho chuka, use dobara range mein mat rakho, warna infinite loop.
- **\`lo + (hi − lo) // 2\`** — Java/C++ mein \`(lo + hi)\` int overflow kar sakta hai. Python mein problem nahi, par habit achhi hai. JS mein \`Math.floor\` zaroori, warna \`mid\` decimal ho jaayega.

Steps: n → n/2 → n/4 → ... → 1, yaani **log₂ n** steps. Space **O(1)** (iterative).`,
          en: `The standard exact-match template keeps \`lo, hi = 0, n − 1\`, loops \`while lo <= hi\`, computes \`mid = lo + (hi − lo) // 2\`, returns on a match, and otherwise sets \`lo = mid + 1\` or \`hi = mid − 1\`.

- **Invariant**: if the target exists, it lies in \`[lo, hi]\`.
- **\`lo <= hi\`** so a one-element range is still checked.
- **\`mid ± 1\`** because mid is already checked; keeping it can loop forever.
- **\`lo + (hi − lo) // 2\`** avoids integer overflow in Java/C++; in JavaScript use \`Math.floor\`.

The range goes n → n/2 → … → 1: **log₂ n** steps, O(1) space iteratively.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Do functions:

- \`binary_search(nums, target)\` — exact match, index ya −1. Har step pe \`lo, mid, hi\` print hote hain taaki tum range ko chhota hota dekh sako.
- \`first_at_least(nums, x)\` — **lower bound**: pehla index jahan value \`>= x\` hai. Yahan \`hi = len(nums)\` aur \`lo < hi\` loop — answer "insert position" bhi ho sakta hai. Python ka \`bisect_left\` yahi karta hai, toh hum usse match karke dikhate hain.

**Complexity:** dono **O(log n) time, O(1) space**.

JS mein \`Math.floor((lo + hi) / 2)\` dhyaan se — bina floor ke \`mid\` 2.5 jaisa ho jaata hai aur \`nums[2.5]\` \`undefined\` deta hai.`,
          en: `Two functions:

- \`binary_search(nums, target)\`: exact match, returning the index or −1, printing \`lo, mid, hi\` at each step so you can watch the range shrink.
- \`first_at_least(nums, x)\`: the **lower bound**, the first index with value \`>= x\`, using \`hi = len(nums)\` and \`lo < hi\`. It matches Python's \`bisect_left\`.

**Complexity**: both are **O(log n) time, O(1) space**. In JavaScript always floor \`mid\`; \`nums[2.5]\` is \`undefined\`.`,
        },
        codeJs: `function binarySearch(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    console.log("  lo =", lo, "mid =", mid, "hi =", hi);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

function firstAtLeast(nums, x) {
  let lo = 0;
  let hi = nums.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const prices = [3, 8, 15, 23, 42, 57, 71, 89];
console.log("search 15:");
console.log("index", binarySearch(prices, 15));
console.log("search 50:");
console.log("index", binarySearch(prices, 50));
console.log(firstAtLeast(prices, 40), firstAtLeast(prices, 100));`,
        codePython: `from bisect import bisect_left

def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        print("  lo =", lo, "mid =", mid, "hi =", hi)
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

def first_at_least(nums, x):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo

prices = [3, 8, 15, 23, 42, 57, 71, 89]
print("search 15:")
print("index", binary_search(prices, 15))
print("search 50:")
print("index", binary_search(prices, 50))
print(first_at_least(prices, 40), bisect_left(prices, 40))
print(first_at_least(prices, 100), bisect_left(prices, 100))`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **Unsorted array pe binary search** — galat answer, bina error ke. Sabse khatarnak bug.
2. **\`while lo < hi\`** exact-match template mein — aakhri ek element check hi nahi hota. (Lower-bound template mein \`<\` sahi hai — template mix mat karo.)
3. **\`lo = mid\`** (bina +1) → jab \`lo\` aur \`hi\` adjacent hon, \`mid\` wahi rehta hai → **infinite loop**.
4. **JS mein \`(lo + hi) / 2\`** bina \`Math.floor\` → fractional index → \`undefined\`.
5. **Overflow** — Java/C++ mein \`(lo + hi) / 2\` bade arrays pe overflow; \`lo + (hi − lo) / 2\` likho.
6. **Duplicates pe "koi bhi index" return karna** jab sawaal "pehla occurrence" maang raha ho — lower bound use karo.`,
          en: `1. **Binary search on unsorted data** silently returns wrong answers.
2. **\`while lo < hi\`** in the exact-match template skips the last element (it is correct in the lower-bound template; do not mix them).
3. **\`lo = mid\`** without \`+ 1\` loops forever when \`lo\` and \`hi\` are adjacent.
4. **\`(lo + hi) / 2\` in JavaScript** without \`Math.floor\` gives a fractional index.
5. **Overflow** in Java/C++; use \`lo + (hi − lo) / 2\`.
6. **Returning any index** when the first occurrence is required; use a lower bound.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `- **Har iteration pe \`lo, mid, hi\` print karo** (jaise CODE section mein). Range har baar chhoti ho rahi hai? Nahi ho rahi → infinite loop ka bug (aksar \`lo = mid\`).
- **Classic test set** har binary search ke liye:
  - target pehla element, aakhri element, beech ka
  - target array mein nahi — sabse chhote se chhota, sabse bade se bada, do elements ke beech
  - empty array, ek element wala array
- **Linear search se compare:** random sorted arrays pe dono chalao, results match hone chahiye.
- **Input sorted hai?** \`assert nums == sorted(nums)\` debugging mein lagao.
- **Template decide karo:** \`[lo, hi]\` closed range (\`<=\`, \`mid ± 1\`) ya \`[lo, hi)\` half-open (\`<\`, \`hi = mid\`). Ek pakdo, mix mat karo.`,
          en: `- **Print \`lo, mid, hi\` each iteration**; if the range stops shrinking, look for \`lo = mid\`.
- **Use a standard test set**: target first, last and middle; target absent below, above and between values; empty and single-element arrays.
- **Compare with linear search** on random sorted arrays.
- **Assert the input is sorted** while debugging.
- **Pick one template**, closed \`[lo, hi]\` or half-open \`[lo, hi)\`, and never mix them.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Sorting ka kharcha:** data sorted nahi hai aur sirf **ek baar** dhoondhna hai → sort O(n log n) + search > linear O(n). Bas linear karo.
- **Exact membership hi chahiye?** Hash set O(1) average — binary search se tez. Binary search tab jeet ta hai jab **order wale sawaal** hon: "pehla ≥ x", "range 100–200 mein kitne", nearest value.
- **Random access zaroori** — linked list pe \`mid\` tak pahunchna hi O(n) hai, binary search bekaar.
- **Data baar-baar badal raha hai** (inserts) → sorted array mein insert O(n). Balanced BST / B-tree better (databases yahi karte hain).
- Monotonic condition na ho toh "binary search on answer" galat result dega.`,
          en: `- **Sorting cost**: for a single lookup on unsorted data, sort + search is worse than an O(n) linear scan.
- **Exact membership only?** A hash set is O(1) average. Binary search wins for ordered questions: first ≥ x, counts in a range, nearest value.
- **Needs random access**: linked lists make reaching \`mid\` O(n).
- **Frequent inserts** make sorted arrays O(n) per insert; balanced BSTs or B-trees are better, as databases use.
- Without a monotonic condition, binary search on the answer gives wrong results.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `**"Kis din se app crash rate 2% cross kar gaya?"** Tumhare paas 365 din ka daily crash-rate data hai, aur ek baar cross hone ke baad wo upar hi raha (monotonic — naya buggy SDK version aaya tha).

\`\`\`python
def first_bad_day(rates, limit=2.0):
    lo, hi = 0, len(rates)          # half-open [lo, hi)
    while lo < hi:
        mid = (lo + hi) // 2
        if rates[mid] > limit:
            hi = mid                # mid could be the first bad day
        else:
            lo = mid + 1
    return lo                       # len(rates) means "never"
\`\`\`

Agar har din ka data check karna mehenga ho (jaise logs ka bada query), toh 365 queries ki jagah **~9 queries**. Yahi soch \`git bisect\` ke peeche hai, aur "binary search on answer" (minimum servers needed, minimum capacity) ke peeche bhi.`,
          en: `**"From which day did the crash rate exceed 2%?"** You have 365 daily values, and once it crossed it stayed above (monotonic, after a buggy SDK release).

\`\`\`python
def first_bad_day(rates, limit=2.0):
    lo, hi = 0, len(rates)          # half-open [lo, hi)
    while lo < hi:
        mid = (lo + hi) // 2
        if rates[mid] > limit:
            hi = mid
        else:
            lo = mid + 1
    return lo                       # len(rates) means "never"
\`\`\`

If checking a day is an expensive log query, this needs about **9 queries instead of 365**. The same idea powers \`git bisect\` and "binary search on the answer".`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "Searching 15 in [3, 8, 15, 23, 42, 57, 71, 89]",
      steps: [
        {
          title: "lo = 0, hi = 7",
          description: "mid = 3 → 23. 23 > 15, so the answer must be left of mid: hi = 2.",
          highlight: "[3 8 15] 23 42 57 71 89",
        },
        {
          title: "lo = 0, hi = 2",
          description: "mid = 1 → 8. 8 < 15, so the answer is right of mid: lo = 2.",
          highlight: "3 8 [15] 23 ...",
        },
        {
          title: "lo = 2, hi = 2",
          description: "mid = 2 → 15. Equal to the target: return index 2.",
          highlight: "found at index 2",
        },
        {
          title: "Only 3 comparisons",
          description: "8 elements needed at most log₂8 + 1 = 4 checks. 10 lakh elements would need about 20.",
          highlight: "O(log n)",
        },
        {
          title: "Target missing (e.g. 50)",
          description: "The range keeps shrinking until lo > hi. Then we return −1. Still O(log n).",
          highlight: "lo > hi → −1",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What must be true of the array for standard binary search to work?",
        options: [
          "It must be sorted",
          "It must have an even length",
          "It must not contain negatives",
          "It must have no more than 1,000 elements",
        ],
        correct: [0],
        explanation: "Binary search aadha phenk ta hai is bharose pe ki order sahi hai. Array sorted hona zaroori hai.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Roughly how many comparisons does binary search need in the worst case for 1,024 sorted elements?",
        options: ["About 10", "About 100", "About 512", "About 1,024"],
        correct: [0],
        explanation: "log₂ 1024 = 10, toh lagbhag 10–11 comparisons. Linear search ko 1,024 tak lag sakte hain.",
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Why do Java and C++ programmers write `mid = lo + (hi - lo) / 2` instead of `(lo + hi) / 2`?",
        options: [
          "It is faster to compute",
          "To avoid integer overflow when lo + hi is very large",
          "To round up instead of down",
          "It handles negative numbers in the array",
        ],
        correct: [1],
        explanation: "Bade arrays pe `lo + hi` int ki limit cross karke overflow ho sakta hai. `lo + (hi − lo) / 2` same answer deta hai bina overflow ke.",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which problems can be solved with binary search?",
        options: [
          "Find a value in a sorted array",
          "Find the first bad version among builds 1..n",
          "Find the minimum truck capacity to ship parcels within D days",
          "Find a value in an unsorted linked list",
        ],
        correct: [0, 1, 2],
        explanation: "Sorted array lookup, first bad version (false→true monotonic), aur min capacity (badhi capacity hamesha kaam karti hai — monotonic) — teeno. Unsorted linked list mein random access hi nahi.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `nums = [3, 8, 15, 23, 42, 57, 71, 89]
target = 71
lo, hi = 0, len(nums) - 1
steps = 0
while lo <= hi:
    mid = (lo + hi) // 2
    steps += 1
    if nums[mid] == target:
        break
    elif nums[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1
print(mid, steps)`,
        codeLanguage: "python",
        options: ["6 3", "6 2", "7 3", "5 3"],
        correct: [0],
        explanation: "mid=3 (23 < 71) → lo=4; mid=5 (57 < 71) → lo=6; mid=6 (71) → found. 3 steps, mid = 6.",
      },
      {
        type: "SPOT_BUG",
        difficulty: 2,
        prompt: "This JavaScript binary search often returns -1 even when the target exists. What is the bug?",
        code: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) / 2;
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
        codeLanguage: "javascript",
        options: [
          "The loop condition should be lo < hi",
          "mid is not floored, so it can be a fractional index",
          "hi should start at nums.length",
          "It should compare with == instead of ===",
        ],
        correct: [1],
        explanation: "`(lo + hi) / 2` JS mein decimal de sakta hai (jaise 1.5). `nums[1.5]` `undefined` hai, toh comparisons galat. `Math.floor` lagao.",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "A bug appeared somewhere in the last 1,000 commits. Running the test suite takes 10 minutes per commit. What should you do?",
        options: [
          "Test every commit from oldest to newest",
          "Use git bisect to binary-search the commit history",
          "Revert all 1,000 commits",
          "Test 50 random commits",
        ],
        correct: [1],
        explanation: "`git bisect` history pe binary search karta hai — ~10 test runs (100 min) vs 1,000 runs. Commit history 'good → bad' monotonic hai.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 1,
        prompt: "Order one iteration of exact-match binary search.",
        options: [
          "Compute mid = lo + (hi − lo) // 2",
          "If nums[mid] equals the target, return mid",
          "If nums[mid] < target set lo = mid + 1, else set hi = mid − 1",
          "Repeat while lo <= hi; if the loop ends, return −1",
        ],
        explanation: "mid nikalo, compare, match pe return, warna sahi half rakho; jab tak lo <= hi.",
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Why is binary search O(log n)?",
        keywords: ["half", "each step", "log", "n/2"],
        explanation: "Har comparison ke baad search range aadhi ho jaati hai: n, n/2, n/4 ... 1. Kitni baar aadha karke 1 tak pahunchoge? log₂ n baar. Isliye steps log n ke proportional.",
      },
    ],
    buildTask: {
      title: "Classic binary search",
      description: `Function \`binarySearch(nums, target)\` likho.

- \`nums\` **ascending order** mein sorted hai aur saare values **distinct** hain.
- \`target\` mile toh uska **index** return karo, warna \`-1\`.
- **O(log n)** chahiye — linear scan (\`indexOf\` / \`index\`) nahi chalega.

Example: \`binarySearch([1, 3, 5, 7, 9], 7)\` → \`3\``,
      functionName: "binarySearch",
      starterJs: `function binarySearch(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  // TODO: loop while lo <= hi
  return -1;
}`,
      starterPython: `def binarySearch(nums, target):
    lo, hi = 0, len(nums) - 1
    # TODO: loop while lo <= hi
    return -1`,
      tests: [
        {
          name: "found in the middle",
          args: [
            [1, 3, 5, 7, 9],
            7,
          ],
          expected: 3,
        },
        {
          name: "first element",
          args: [
            [1, 3, 5, 7, 9],
            1,
          ],
          expected: 0,
        },
        {
          name: "last element",
          args: [
            [1, 3, 5, 7, 9],
            9,
          ],
          expected: 4,
        },
        {
          name: "missing value between elements",
          args: [
            [1, 3, 5, 7, 9],
            4,
          ],
          expected: -1,
        },
        {
          name: "empty array",
          args: [
            [],
            5,
          ],
          expected: -1,
        },
        {
          name: "single element found",
          args: [
            [42],
            42,
          ],
          expected: 0,
          hidden: true,
        },
        {
          name: "negatives and last position",
          args: [
            [-10, -3, 0, 5, 9, 12],
            12,
          ],
          expected: 5,
          hidden: true,
        },
      ],
      hints: [
        "Array sorted hai, toh beech wale element se compare karke aadha hissa hamesha ke liye hata sakte ho.",
        "Step 1: while lo <= hi. Step 2: mid = lo + (hi − lo) // 2 (JS: Math.floor). Step 3: equal → return mid; chhota → lo = mid + 1; bada → hi = mid − 1. Step 4: loop khatam → −1.",
        `while lo <= hi:
    mid = lo + (hi - lo) // 2
    if nums[mid] == target:
        return mid
    if nums[mid] < target:
        lo = mid + 1
    else:
        # ...`,
      ],
      explainQuestions: [
        {
          question: "What is the time and space complexity of your solution?",
          keywords: ["o(log n)", "o(1) space", "halves"],
        },
        {
          question: "Why is the loop condition lo <= hi and not lo < hi?",
          keywords: ["single element", "lo equals hi", "last element"],
        },
        {
          question: "Why do you set lo = mid + 1 instead of lo = mid?",
          keywords: ["already checked", "infinite loop", "mid excluded"],
        },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "Explain binary search and its complexity.",
        short: "Binary search works on sorted data. It compares the target with the middle element; if they are equal it returns, otherwise it discards the half that cannot contain the target and repeats on the other half. Since the search range halves each step, it takes O(log n) time and O(1) space iteratively.",
        deep: `- Invariant: the target, if present, is always within \`[lo, hi]\`.
- Watch for: \`lo <= hi\` vs \`lo < hi\`, \`mid ± 1\`, flooring in JavaScript, overflow in Java/C++.
- Variants: first/last occurrence (lower/upper bound), search in rotated sorted array, binary search on the answer.
- Recursive version uses O(log n) stack space.`,
        followUps: [
          "How do you find the first occurrence of a duplicate value?",
          "How would you search a rotated sorted array?",
          "What is binary search on the answer?",
        ],
        commonMistake: "Using `lo = mid` with `lo <= hi`, which can loop forever.",
        keywords: ["sorted", "middle", "discard half", "o(log n)", "invariant"],
        difficulty: 1,
        roles: ["SDE", "BACKEND", "FRONTEND"],
      },
      {
        question: "What is 'binary search on the answer'? Give an example.",
        short: "When the answer lies in a numeric range and a check function is monotonic, for example 'can we ship all parcels within D days with capacity C?' is false for small C and true for all larger C, you can binary-search over C to find the smallest value where the check is true. Each check costs O(n), so the total is O(n log range).",
        deep: `\`\`\`python
def min_capacity(weights, days):
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if can_ship(weights, days, mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
\`\`\`
Other examples: Koko eating bananas, minimum days to make bouquets, integer square root.`,
        followUps: [
          "How do you choose lo and hi?",
          "Why must the check be monotonic?",
          "What is the total time complexity?",
        ],
        commonMistake: "Applying it when the feasibility check is not monotonic.",
        keywords: ["monotonic", "feasibility check", "search space", "o(n log range)", "minimum"],
        difficulty: 3,
        roles: ["SDE"],
      },
    ],
  },
  {
    slug: "recursion",
    estMinutes: 55,
    difficulty: 2,
    prerequisites: ["big-o"],
    objectives: [
      "Write recursive functions with a correct base case and a smaller recursive case",
      "Trace recursive calls on the call stack, including how return values unwind",
      "Analyse time and stack space of recursive solutions and fix exponential blow-up with memoization",
      "Use recursion naturally on nested data such as folders, trees and nested lists",
    ],
    technicalDefinition: "Recursion is a technique where a function solves a problem by calling itself on smaller instances until reaching a base case; each call occupies a frame on the call stack, so stack depth determines space usage.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Recursion** matlab ek function jo **khud ko call** karta hai — par har baar **chhote** problem ke saath.

Har recursive function ke do zaroori hisse:
- **Base case** — sabse chhota problem jiska answer seedha pata hai. Yahan function ruk ta hai. (\`factorial(1) = 1\`)
- **Recursive case** — problem ko thoda chhota karke khud ko call karo, aur us answer se apna answer banao. (\`factorial(n) = n × factorial(n − 1)\`)

Base case nahi hai ya problem chhota nahi ho raha → function kabhi nahi rukega → **stack overflow** (Python: \`RecursionError\`).

Har call **call stack** pe ek frame banata hai; base case ke baad answers ulte order mein wapas aate hain.`,
          en: `**Recursion** is when a function **calls itself**, each time on a **smaller** problem.

Every recursive function needs:
- **A base case**: the smallest problem with a direct answer, where recursion stops, e.g. \`factorial(1) = 1\`.
- **A recursive case**: call itself on a smaller input and build the answer from it, e.g. \`factorial(n) = n × factorial(n − 1)\`.

Without a reachable base case the calls never stop and you get a **stack overflow** (\`RecursionError\` in Python). Each call adds a frame to the **call stack**, and answers return in reverse order.`,
          hi: `**रिकर्शन** का मतलब है एक फ़ंक्शन जो **खुद को कॉल** करता है — पर हर बार **छोटी** समस्या के साथ।

हर रिकर्सिव फ़ंक्शन के दो ज़रूरी हिस्से:
- **बेस केस** — सबसे छोटी समस्या जिसका उत्तर सीधे पता है। यहाँ फ़ंक्शन रुकता है। (\`factorial(1) = 1\`)
- **रिकर्सिव केस** — समस्या को थोड़ा छोटा करके खुद को कॉल करो। (\`factorial(n) = n × factorial(n − 1)\`)

बेस केस नहीं है तो फ़ंक्शन कभी नहीं रुकेगा → **स्टैक ओवरफ़्लो**। हर कॉल **कॉल स्टैक** पर एक फ़्रेम बनाता है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Cinema hall mein andhera hai aur tumhe jaanna hai ki tum **kaunsi row** mein baithe ho. Peeche mudke ginti nahi kar sakte.

Trick: tum aage wale se poochte ho — "Bhai, tum kaunsi row mein ho?" Usse bhi nahi pata, toh wo **apne aage wale se wahi sawaal** poochta hai. Aise hi sawaal aage badhta jaata hai...

...jab tak **pehli row** wala nahi aata. Wo kehta hai: "Main row **1** mein hoon, mere aage koi nahi." — ye **base case** hai.

Ab answers **wapas** aate hain: dusri row wala sunke bolta hai "toh main 2", teesra "main 3"... aur tum tak answer pahunchta hai, +1 karke.

Yahi recursion hai: sawaal chhota hota jaata hai (aage jaata hai), base case pe ruk ta hai, aur answers **ulte order** mein laut te hain — bilkul call stack ki tarah.`,
          en: `You are in a dark cinema hall and want to know your **row number** without turning around.

You ask the person in front, "Which row are you in?" They do not know either, so they ask the person in front of them, and so on...

...until the **first row**, who says "I am in row **1**": the **base case**.

Answers then travel **back**: "so I am 2", "I am 3"... until it reaches you, plus one.

That is recursion: the question shrinks, stops at the base case, and answers return in **reverse order**, exactly like the call stack.`,
          hi: `सिनेमा हॉल में अँधेरा है और आपको जानना है कि आप **कौन-सी पंक्ति** में बैठे हैं।

तरकीब: आप आगे वाले से पूछते हैं — "आप कौन-सी पंक्ति में हैं?" उसे भी नहीं पता, तो वह **अपने आगे वाले से वही सवाल** पूछता है...

...जब तक **पहली पंक्ति** वाला नहीं आता। वह कहता है: "मैं पंक्ति **1** में हूँ" — यही **बेस केस** है।

अब जवाब **वापस** आते हैं: "तो मैं 2", "मैं 3"... और आप तक जवाब +1 करके पहुँचता है।

सवाल छोटा होता जाता है, बेस केस पर रुकता है, और जवाब **उल्टे क्रम** में लौटते हैं — बिल्कुल कॉल स्टैक की तरह।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Kuch data khud **nested** hota hai — andar ek aur wahi cheez:
- **Folders** ke andar folders ke andar files.
- **Comments** ke replies ke replies (Reddit / Instagram threads).
- **Categories:** Electronics → Mobiles → Android → Samsung.
- **JSON** ke andar objects ke andar arrays.

Kitne level gehra hai, pata nahi. Loops se aisa data handle karna mushkil — kitne nested loops likhoge? Recursion bolta hai: "Ek level handle karo, andar wale ko **khud ko hi** de do."

Aage ke DSA topics — **trees, graphs (DFS), backtracking, merge sort, quick sort, dynamic programming** — sab recursion pe khade hain. Isko samajh liya toh aadha DSA aasaan ho jaata hai.`,
          en: `Some data is naturally **nested**: folders inside folders, replies to replies, category trees, JSON objects inside arrays inside objects. You do not know the depth in advance, so nested loops cannot handle it. Recursion says: handle one level and hand the inner part to **yourself**.

Upcoming topics, including **trees, graph DFS, backtracking, merge sort, quick sort and dynamic programming**, are all built on recursion. Master it and half of DSA becomes easier.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **\`rm -r\`, \`cp -r\`, \`grep -r\` (Linux/macOS)** — \`-r\` ka matlab hi **recursive** hai: folder ke andar har subfolder mein ghuso aur wahi kaam karo. Python ka \`os.walk\` bhi folder tree ko isi tarah traverse karta hai.
- **Parsers aur compilers** — bahut saare parsers (programming languages, JSON, math expressions) **recursive descent** technique use karte hain: expression ke andar expression ko parse karne ke liye function khud ko call karta hai.
- **Nested comment threads (Reddit jaise sites)** — reply ke andar reply ke andar reply. Aise thread ko render karna ek recursive kaam hai: "ye comment dikhao, phir iske har reply ke liye yahi function chalao."`,
          en: `- **\`rm -r\`, \`cp -r\`, \`grep -r\`**: the \`-r\` literally means **recursive**, applying the operation to every subfolder. Python's \`os.walk\` traverses folder trees the same way.
- **Parsers and compilers**: many use **recursive descent**, where parsing an expression calls the same function for sub-expressions.
- **Nested comment threads** on sites like Reddit: rendering means "show this comment, then run the same function for each reply".`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `\`factorial(3)\` call karne pe **call stack** pe kya hota hai:

1. \`factorial(3)\` ka frame push — \`n = 3\`. Ye \`3 * factorial(2)\` pe ruk ke wait karta hai.
2. \`factorial(2)\` push — \`n = 2\`, wait.
3. \`factorial(1)\` push — **base case**, \`1\` return. Frame pop.
4. \`factorial(2)\` ko 1 mila → \`2 * 1 = 2\` return, pop.
5. \`factorial(3)\` ko 2 mila → \`3 * 2 = 6\` return, pop.

Har frame mein apne **local variables** aur **return address** hote hain — isliye har call ka \`n\` alag hai.

**Space:** stack depth = O(n). Python default limit **1000** frames ke aas-paas hai (\`sys.getrecursionlimit()\`); usse aage \`RecursionError\`. JS (V8) mein limit roughly 10 hazaar ke aas-paas, phir \`Maximum call stack size exceeded\`.

Python **tail-call optimisation** nahi karta, toh deep recursion ko loop mein badalna pad sakta hai.`,
          en: `For \`factorial(3)\` the **call stack** goes:

1. Push \`factorial(3)\` (\`n = 3\`), waiting on \`3 * factorial(2)\`.
2. Push \`factorial(2)\`, waiting.
3. Push \`factorial(1)\`: **base case**, returns 1 and pops.
4. \`factorial(2)\` returns 2 and pops.
5. \`factorial(3)\` returns 6 and pops.

Each frame has its own locals and return address. Stack space is O(depth). Python's default limit is about **1000** frames (\`sys.getrecursionlimit()\`), after which it raises \`RecursionError\`; V8 allows roughly ten thousand before "Maximum call stack size exceeded". Python has no tail-call optimisation.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Teen recursive functions:

- \`factorial(n)\` — base case \`n <= 1\`. **O(n) time, O(n) stack space.**
- \`flatten(items)\` — nested list ko flat karo. Har item: list hai → khud ko call karke result jodo; warna seedha add. Kitni bhi gehrai ho, chalega. **O(total items) time, O(max depth) stack.**
- \`fib_memo(n)\` — Fibonacci. Naive recursion O(2ⁿ) hai kyunki same values baar-baar compute hoti hain; \`memo\` dict se har n ek hi baar → **O(n) time, O(n) space**.

Python mein \`memo\` ko default parameter nahi banaya (mutable default bug yaad hai?) — \`None\` default, andar naya dict.`,
          en: `Three recursive functions:

- \`factorial(n)\` with base case \`n <= 1\`: **O(n) time, O(n) stack**.
- \`flatten(items)\`: if an item is a list, recurse and extend; otherwise append. Works for any depth: **O(total items) time, O(max depth) stack**.
- \`fib_memo(n)\`: naive Fibonacci is O(2ⁿ) because it recomputes values; a \`memo\` dict computes each n once: **O(n) time and space**.

The Python memo uses a \`None\` default to avoid the mutable default argument bug.`,
        },
        codeJs: `function factorial(n) {
  if (n <= 1) return 1;            // base case
  return n * factorial(n - 1);
}

function flatten(items) {
  const result = [];
  for (const item of items) {
    if (Array.isArray(item)) result.push(...flatten(item));   // recursive case
    else result.push(item);
  }
  return result;
}

function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (!memo.has(n)) memo.set(n, fibMemo(n - 1, memo) + fibMemo(n - 2, memo));
  return memo.get(n);
}

console.log(factorial(5));
console.log(flatten([1, [2, [3, [4]]], 5]));
console.log(fibMemo(10), fibMemo(50));`,
        codePython: `def factorial(n):
    if n <= 1:              # base case
        return 1
    return n * factorial(n - 1)

def flatten(items):
    result = []
    for item in items:
        if isinstance(item, list):
            result.extend(flatten(item))   # recursive case
        else:
            result.append(item)
    return result

def fib_memo(n, memo=None):
    if memo is None:
        memo = {}
    if n <= 1:
        return n
    if n not in memo:
        memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

print(factorial(5))
print(flatten([1, [2, [3, [4]]], 5]))
print(fib_memo(10), fib_memo(50))`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `1. **Base case missing ya kabhi reach nahi hota** — \`factorial(-1)\` jab base case sirf \`n == 1\` ho → infinite recursion. \`n <= 1\` likho.
2. **Problem chhota nahi kiya** — \`f(n)\` andar \`f(n)\` hi call kar diya.
3. **Recursive call ka result use/return karna bhool gaye** — \`flatten(item)\` call kiya par result jodha nahi; ya \`return\` bhool gaye → \`None\`.
4. **Exponential recursion** — naive \`fib(n) = fib(n−1) + fib(n−2)\`. n = 40 pe crore calls. **Memoization** lagao.
5. **Bahut gehri recursion** — 1 lakh lambi linked list pe recursion → Python \`RecursionError\`. Loop use karo.
6. **Shared mutable state** — sab calls ek hi global list mein likh rahe, phir result mein purana data. Result return karo ya explicitly pass karo.`,
          en: `1. **Missing or unreachable base case**, e.g. only \`n == 1\` while calling \`factorial(-1)\`.
2. **Not shrinking the problem**: \`f(n)\` calls \`f(n)\`.
3. **Ignoring the recursive call's result** or forgetting \`return\`, giving \`None\`.
4. **Exponential recursion** like naive Fibonacci; add memoization.
5. **Very deep recursion** on long inputs hits the recursion limit; use a loop.
6. **Shared mutable state** across calls leaking old data.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `- **Depth ke saath indentation print karo:**
  \`\`\`python
  def fact(n, depth=0):
      print("  " * depth + f"fact({n})")
      ...
  \`\`\`
  Ek tree jaisa trace dikhega — calls kahan ja rahi hain aur base case pe ruk rahi hain ya nahi.
- **\`RecursionError: maximum recursion depth exceeded\`** → 99% chance base case galat hai ya input chhota nahi ho raha. Traceback mein same line baar-baar dikhegi.
- **Sabse chhote input se test karo:** pehle base case (\`n = 0, 1\`), phir \`n = 2\`, phir \`n = 3\`. Agar \`f(2)\` sahi hai aur \`f(n)\` ka logic sahi hai, toh sab sahi (yahi **induction** hai).
- **Slow hai?** Calls gino (counter). Same arguments baar-baar aa rahe → memoize (\`functools.lru_cache\`).
- Debugger ka **Call Stack panel** dekho — har frame aur uske local variables dikhte hain.`,
          en: `- **Print with depth-based indentation** to see a tree of calls.
- **\`RecursionError\`** almost always means a wrong base case or a non-shrinking input; the traceback repeats the same line.
- **Test the smallest inputs first** (0, 1, 2, 3). If the base case and the step are right, everything is (induction).
- **Slow?** Count calls; repeated arguments call for memoization (\`functools.lru_cache\`).
- Watch the debugger's **Call Stack panel** to see each frame's locals.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Memory:** har call ek stack frame. Loop O(1) space mein wahi kaam kar sakta hai (factorial, sum, linked list traverse). Simple linear kaam → **loop** prefer karo.
- **Depth limit:** Python ~1000. Deep data (1 lakh nodes ki chain) → iterative with explicit stack (\`stack = [root]\` + while loop).
- **Speed:** function call ka overhead loop se zyada. Plus exponential trap — **memoization / DP** se bachao.
- **Readability:** trees, nested data, divide & conquer (merge sort), backtracking — yahan recursion code ko bahut chhota aur saaf banata hai. Iterative version complex aur bug-prone.

Rule: structure nested/branching hai → recursion. Simple linear repeat → loop.`,
          en: `- **Memory**: each call is a stack frame; a loop does linear tasks in O(1) space, so prefer loops for them.
- **Depth limit**: about 1000 in Python; deep data needs an iterative version with an explicit stack.
- **Speed**: calls cost more than loop iterations, and naive recursion can explode exponentially without **memoization**.
- **Readability**: for trees, nested data, divide and conquer and backtracking, recursion is much shorter and clearer.

Nested or branching structure → recursion; simple linear repetition → loop.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `**E-commerce category tree** — Flipkart/Amazon jaise sites pe categories nested hoti hain: Electronics → Mobiles → Android Phones. Admin panel ko har category mein **total products** dikhane hain (subcategories mila ke).

\`\`\`python
def total_products(category):
    total = category["product_count"]          # is level ke products
    for child in category["children"]:         # base case: children = []
        total += total_products(child)         # recursive case
    return total
\`\`\`

Category tree kitna bhi gehra ho, ye 5 line ka function kaam karega. Loop se likhte toh explicit stack manage karna padta. Real project mein ye data database se aata hai, aur bahut gehre trees ke liye log iterative version ya SQL recursive CTE (\`WITH RECURSIVE\`) use karte hain — interview mein ye trade-off bolna plus point hai.`,
          en: `**An e-commerce category tree**: Electronics → Mobiles → Android Phones. The admin panel shows total products per category, including subcategories.

\`\`\`python
def total_products(category):
    total = category["product_count"]
    for child in category["children"]:      # base case: no children
        total += total_products(child)      # recursive case
    return total
\`\`\`

This works for any depth. For very deep trees teams use an iterative version or a SQL recursive CTE (\`WITH RECURSIVE\`), a trade-off worth mentioning in interviews.`,
        },
      },
    ],
    visualization: {
      kind: "STACK",
      title: "Call stack for factorial(3)",
      steps: [
        {
          title: "Push factorial(3)",
          description: "n = 3 is not the base case. It needs factorial(2) before it can multiply, so it waits.",
          highlight: "stack: [f(3)]",
        },
        {
          title: "Push factorial(2)",
          description: "n = 2, still not the base case. Waits for factorial(1).",
          highlight: "stack: [f(3), f(2)]",
        },
        {
          title: "Push factorial(1)",
          description: "Base case reached: returns 1 immediately. Deepest point of the stack.",
          highlight: "stack: [f(3), f(2), f(1)] → 1",
        },
        {
          title: "Pop factorial(1), resume factorial(2)",
          description: "factorial(2) receives 1 and returns 2 × 1 = 2.",
          highlight: "stack: [f(3), f(2)] → 2",
        },
        {
          title: "Pop factorial(2), resume factorial(3)",
          description: "factorial(3) receives 2 and returns 3 × 2 = 6. Stack is empty again; max depth was 3, so O(n) stack space.",
          highlight: "stack: [] → 6",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is a base case in recursion?",
        options: [
          "The first call made by the user",
          "The condition where the function returns without calling itself",
          "The largest input the function can handle",
          "A loop inside the recursive function",
        ],
        correct: [1],
        explanation: "Base case wo sabse chhota input hai jiska answer bina recursion ke seedha return hota hai — yahin recursion rukta hai.",
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What happens in Python if a recursive function never reaches its base case?",
        options: [
          "It runs forever silently",
          "It raises RecursionError (stack overflow)",
          "It returns None",
          "Python converts it into a loop",
        ],
        correct: [1],
        explanation: "Har call stack frame banata hai; limit (~1000) cross hone pe Python `RecursionError` raise karta hai.",
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "What is the time complexity of naive recursive Fibonacci, fib(n) = fib(n−1) + fib(n−2)?",
        options: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
        correct: [3],
        explanation: "Har call do calls banati hai aur same values baar-baar compute hoti hain → roughly O(2ⁿ). Memoization se O(n).",
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which are required for a correct recursive function?",
        options: [
          "A base case",
          "Each recursive call moves closer to the base case",
          "A global variable to store results",
          "A loop inside the function",
        ],
        correct: [0, 1],
        explanation: "Base case aur har call mein base case ki taraf progress zaroori hain. Global variable ya loop zaroori nahi.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 1,
        prompt: "What does this code print?",
        code: `def countdown(n):
    if n == 0:
        return "Go!"
    return str(n) + " " + countdown(n - 1)

print(countdown(3))`,
        codeLanguage: "python",
        options: ["3 2 1 Go!", "Go! 1 2 3", "3 2 1 0 Go!", "Go!"],
        correct: [0],
        explanation: "countdown(3) = \"3 \" + countdown(2) = \"3 2 \" + countdown(1) = ... base case \"Go!\". Result: `3 2 1 Go!`.",
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this JavaScript code print?",
        code: `function sumDigits(n) {
  if (n < 10) return n;
  return (n % 10) + sumDigits(Math.floor(n / 10));
}
console.log(sumDigits(4096), sumDigits(7));`,
        codeLanguage: "javascript",
        options: ["19 7", "4096 7", "10 7", "19 0"],
        correct: [0],
        explanation: "sumDigits(4096) = 6 + sumDigits(409) = 6 + 9 + sumDigits(40) = 6 + 9 + 0 + 4 = 19. sumDigits(7) base case → 7.",
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "Your recursive fib(n) works for n = 10 but takes forever for n = 50. What is the best fix?",
        options: [
          "Increase the recursion limit with sys.setrecursionlimit",
          "Cache results of fib(k) (memoization) so each value is computed once",
          "Run it on a faster computer",
          "Add more base cases for n = 2, 3 and 4",
        ],
        correct: [1],
        explanation: "Problem repeated subproblems ka hai — memoization (cache) se har n ek baar compute hota hai, O(n). Recursion limit badhane se speed nahi badhti.",
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the call-stack events for factorial(3).",
        options: [
          "factorial(3) is pushed and waits for factorial(2)",
          "factorial(2) is pushed and waits for factorial(1)",
          "factorial(1) hits the base case and returns 1",
          "factorial(2) returns 2 and is popped",
          "factorial(3) returns 6 and is popped",
        ],
        explanation: "Push 3, push 2, push 1 (base case returns 1), phir unwind: f(2) returns 2, f(3) returns 6.",
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain what happens on the call stack when a recursive function runs, and why very deep recursion fails.",
        keywords: ["stack frame", "push", "base case", "pop", "limit"],
        explanation: "Har call ek naya stack frame push karta hai (locals + return address). Base case milne pe frames ek-ek karke pop hote hain aur values wapas jaati hain. Stack ka size limited hai, toh bahut gehri recursion limit cross karke stack overflow / RecursionError deti hai.",
      },
    ],
    buildTask: {
      title: "Flatten a nested list",
      description: `Function \`flatten(nested)\` likho jo kisi bhi gehrai ki nested list ko ek **flat list** mein badal de, **order same** rakhte hue.

- Items numbers ya strings ho sakte hain, ya phir aur lists.
- Empty lists gayab ho jaati hain.
- Recursion use karo: item list hai → usse bhi flatten karo.

Example: \`flatten([1, [2, [3, [4]]], 5])\` → \`[1, 2, 3, 4, 5]\``,
      functionName: "flatten",
      starterJs: `function flatten(nested) {
  const result = [];
  // TODO: for each item, recurse if it is an array (Array.isArray)
  return result;
}`,
      starterPython: `def flatten(nested):
    result = []
    # TODO: for each item, recurse if it is a list (isinstance)
    return result`,
      tests: [
        {
          name: "one level",
          args: [
            [
              1,
              [2, 3],
              4,
            ],
          ],
          expected: [1, 2, 3, 4],
        },
        {
          name: "deep nesting",
          args: [
            [
              1,
              [
                2,
                [
                  3,
                  [4],
                ],
              ],
              5,
            ],
          ],
          expected: [1, 2, 3, 4, 5],
        },
        {
          name: "empty list",
          args: [
            [],
          ],
          expected: [],
        },
        {
          name: "only empty lists",
          args: [
            [
              [
                [],
              ],
            ],
          ],
          expected: [],
        },
        {
          name: "several branches",
          args: [
            [
              [1, 2],
              [
                3,
                [4, 5],
              ],
              6,
            ],
          ],
          expected: [1, 2, 3, 4, 5, 6],
        },
        {
          name: "strings deep inside",
          args: [
            [
              [
                ["deep"],
              ],
              "x",
            ],
          ],
          expected: ["deep", "x"],
          hidden: true,
        },
        {
          name: "zeros and empties",
          args: [
            [
              0,
              [
                [0],
              ],
              [],
            ],
          ],
          expected: [0, 0],
          hidden: true,
        },
      ],
      hints: [
        "Base case: koi item list nahi hai → seedha result mein daalo. Recursive case: item list hai → flatten(item) ka result result mein jodo.",
        "Step 1: khaali result. Step 2: har item pe check — list hai? Step 3: haan → result.extend(flatten(item)); nahi → result.append(item). Step 4: result return.",
        `for item in nested:
    if isinstance(item, list):
        result.extend(flatten(item))
    else:
        # ...`,
      ],
      explainQuestions: [
        {
          question: "What is the base case of your recursion?",
          keywords: ["not a list", "append", "empty list", "no recursion"],
        },
        {
          question: "What is the time and stack-space complexity of your solution?",
          keywords: ["o(n)", "total items", "depth", "stack"],
        },
        {
          question: "What would happen with a list nested 10,000 levels deep, and how could you avoid it?",
          keywords: ["recursionerror", "stack overflow", "iterative", "explicit stack"],
        },
      ],
      estMinutes: 18,
    },
    interview: [
      {
        question: "Recursion vs iteration: when would you use each?",
        short: "Use recursion when the problem has a naturally recursive structure such as trees, nested data, divide and conquer or backtracking, because the code becomes short and mirrors the structure. Use iteration for simple linear repetition or very deep inputs, since each recursive call uses a stack frame and languages like Python cap recursion depth and lack tail-call optimisation.",
        deep: `- Any recursion can be converted to iteration with an explicit stack (e.g. DFS with \`stack = [root]\`).
- Recursion costs O(depth) stack space; iteration can often be O(1).
- Overlapping subproblems → memoization or bottom-up DP (iterative).
- Python default limit ~1000; JS engines allow more but still overflow.`,
        followUps: [
          "How do you convert a recursive DFS to iterative?",
          "What is tail recursion?",
          "Why does Python not optimise tail calls?",
        ],
        commonMistake: "Claiming recursion is always slower or always better; the answer depends on structure and depth.",
        keywords: ["base case", "stack frame", "depth", "tree", "explicit stack"],
        difficulty: 2,
        roles: ["SDE", "BACKEND"],
      },
      {
        question: "What is a stack overflow in recursion and how do you prevent it?",
        short: "Each call pushes a frame onto a limited call stack. If recursion goes too deep, because the base case is missing or unreachable or the input is huge, the stack runs out and the runtime throws an error: RecursionError in Python or 'Maximum call stack size exceeded' in JavaScript. Prevent it with a correct base case, ensuring progress toward it, and switching to iteration or an explicit stack for deep inputs.",
        deep: `- Check: does every path reach the base case? Are negative or empty inputs handled?
- Reduce depth: divide and conquer (log n depth) instead of peeling one element at a time (n depth).
- Raising \`sys.setrecursionlimit\` is a last resort and can crash the interpreter.`,
        followUps: [
          "What is the default recursion limit in Python?",
          "How does memoization affect stack depth?",
          "How would you flatten a very deeply nested list safely?",
        ],
        commonMistake: "Fixing a RecursionError by only raising the recursion limit without examining the base case.",
        keywords: ["call stack", "frame", "base case", "recursionerror", "iterative"],
        difficulty: 2,
        roles: ["SDE", "BACKEND", "FRONTEND"],
      },
    ],
    promptCard: {
      title: "Debug my recursive function",
      category: "DEBUGGING",
      task: "Find why a recursive function gives wrong results, recurses forever, or is too slow, by tracing the call stack on a small input.",
      whenToUse: "When you hit RecursionError / 'Maximum call stack size exceeded', get None or wrong answers from a recursive function, or it is very slow for medium inputs.",
      template: `You are a patient DSA tutor. Help me debug my recursive function.

Language: [LANGUAGE]
What it should do: [EXPECTED_BEHAVIOUR]

Code:
\`\`\`
[PASTE_CODE]
\`\`\`

Failing input: [FAILING_INPUT]
What happens (error or wrong output): [ACTUAL_RESULT]

Please:
1. Identify the base case(s) and check whether every path reaches one.
2. Check that each recursive call works on a strictly smaller input.
3. Trace the call stack for the smallest failing input as an indented list of calls and return values.
4. Point to the exact line causing the bug and explain why.
5. If it is slow, say whether subproblems repeat and whether memoization helps; give the complexity before and after.
Show only the corrected lines, not a full rewrite.`,
      variables: [
        {
          key: "LANGUAGE",
          label: "Python or JavaScript",
        },
        {
          key: "EXPECTED_BEHAVIOUR",
          label: "What the function should return, with one example",
        },
        {
          key: "PASTE_CODE",
          label: "Your recursive function",
        },
        {
          key: "FAILING_INPUT",
          label: "The smallest input that fails",
        },
        {
          key: "ACTUAL_RESULT",
          label: "The error message or wrong output you got",
        },
      ],
      whyItWorks: [
        {
          part: "Base case and progress checks",
          why: "These two causes explain most recursion bugs, so checking them first is efficient.",
        },
        {
          part: "Smallest failing input",
          why: "A small input keeps the stack trace short enough to read and reason about.",
        },
        {
          part: "Indented call trace",
          why: "Makes the invisible call stack visible, which is how you build intuition for recursion.",
        },
        {
          part: "Memoization check with complexity",
          why: "Separates correctness bugs from performance problems like exponential recomputation.",
        },
      ],
      verifyChecklist: [
        "Re-run the failing input and the base-case inputs after applying the fix.",
        "Trace one call by hand and compare with the AI's trace.",
        "Test an edge input such as 0, an empty list, or a negative number.",
        "If memoization was added, check the cache is not shared incorrectly between separate top-level calls.",
      ],
      sampleOutput: `Base case: \`if n == 1: return 1\`. It is never reached for n = 0, so factorial(0) calls factorial(-1), factorial(-2)... forever.
Trace for factorial(0):
  factorial(0)
    factorial(-1)
      factorial(-2)
        ... RecursionError
Fix (line 2): \`if n <= 1: return 1\`
Complexity: O(n) time, O(n) stack; no repeated subproblems, so memoization is not needed.`,
    },
  },
];
