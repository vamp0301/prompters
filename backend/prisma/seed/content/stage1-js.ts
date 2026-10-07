import type { SeedTopicContent } from "./types.js";

/**
 * Stage 1B — JavaScript fundamentals and intermediate topics.
 * Teaching language: Hinglish (primary), simple English, Devanagari Hindi for
 * DEFINITION and ANALOGY sections.
 */
export const topics: SeedTopicContent[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // 1. Variables and types
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "js-variables-types",
    estMinutes: 35,
    difficulty: 1,
    prerequisites: ["how-code-runs"],
    objectives: [
      "let, const aur var mein farak samajhna aur sahi jagah sahi keyword use karna",
      "JavaScript ke 7 primitive types aur object type pehchanna",
      "typeof operator se kisi value ka type check karna aur uske gotchas (null, array) jaanna",
      "Type coercion ('5' + 2 vs '5' - 2) ko predict kar paana",
    ],
    technicalDefinition:
      "A variable in JavaScript is a named binding to a value, declared with let, const or var, where the value's type (string, number, bigint, boolean, undefined, null, symbol or object) is determined dynamically at runtime.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Variable** ek naam wala dabba hai jismein tum koi value rakhte ho, taaki baad mein usse naam se use kar sako. JavaScript mein variable banane ke teen tareeke hain: \`let\` (value badal sakti hai), \`const\` (ek baar assign, phir dobara assign nahi) aur purana \`var\` (aaj kal avoid karo).

Har value ka ek **type** hota hai: \`string\` ("Rahul"), \`number\` (42, 3.14), \`boolean\` (true/false), \`undefined\` (value abhi di hi nahi), \`null\` (jaan-boojh ke khaali), \`bigint\` aur \`symbol\`. Inke alawa sab kuch, jaise arrays aur objects, \`object\` type hai.

JavaScript **dynamically typed** hai, matlab type tum nahi likhte, runtime pe value dekh ke JS khud decide karti hai.`,
          en: `A **variable** is a named box that holds a value so you can use it later by its name. JavaScript gives three keywords to create one: \`let\` (value can change), \`const\` (assigned once, cannot be reassigned) and the old \`var\` (avoid it today).

Every value has a **type**: \`string\`, \`number\`, \`boolean\`, \`undefined\`, \`null\`, \`bigint\` and \`symbol\`. Everything else, like arrays and objects, is of type \`object\`. JavaScript is **dynamically typed**: you do not write the type, the engine figures it out at runtime from the value.`,
          hi: `**वेरिएबल** एक नाम वाला डिब्बा है जिसमें आप कोई वैल्यू रखते हैं, ताकि बाद में उसे नाम से इस्तेमाल कर सकें। JavaScript में वेरिएबल बनाने के तीन तरीके हैं: \`let\` (वैल्यू बदल सकती है), \`const\` (एक बार दी गई वैल्यू दोबारा assign नहीं होती) और पुराना \`var\` (आजकल इससे बचें)।

हर वैल्यू का एक **टाइप** होता है: string, number, boolean, undefined, null, bigint और symbol। बाकी सब, जैसे array और object, \`object\` टाइप के होते हैं। JavaScript में टाइप लिखना नहीं पड़ता, रनटाइम पर वैल्यू देखकर इंजन खुद टाइप तय करता है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Socho tum ek **chai stall** chalate ho. Counter pe kuch dabbe rakhe hain jin pe label laga hai: "Cheeni", "Chai patti", "Aaj ka galla".

- **"Aaj ka galla"** wala dabba \`let\` jaisa hai: din bhar paise aate-jaate rehte hain, value badalti rehti hai.
- **"Dukaan ka naam: Sharma Tea Stall"** wala board \`const\` jaisa hai: ek baar laga diya, roz-roz naam nahi badalte.
- **\`var\`** woh purana dabba hai jiska label kabhi kabhi poori dukaan mein dikh jaata hai, galat jagah pe bhi. Confusion hota hai, isliye naye dukaan wale use nahi karte.

Aur dabbe ke andar kya hai, woh **type** hai: cheeni (string jaisi cheez), paise (number), "dukaan khuli hai?" (boolean). Khaali dabba jo abhi bhara hi nahi = \`undefined\`, aur dabba jo tumne jaan-boojh ke khaali rakha = \`null\`.`,
          en: `Imagine you run a **tea stall**. On the counter are labelled boxes.

- The **"Today's cash"** box is like \`let\`: money keeps coming in and going out, so the value changes.
- The **shop name board** is like \`const\`: you put it up once and do not change it daily.
- \`var\` is an old box whose label sometimes shows up all over the shop, even where it should not. That causes confusion.

What is inside a box is its **type**: sugar (string-like), cash (number), "is the shop open?" (boolean). A box never filled is \`undefined\`; a box you deliberately keep empty is \`null\`.`,
          hi: `मान लीजिए आप एक **चाय की दुकान** चलाते हैं। काउंटर पर लेबल लगे कुछ डिब्बे रखे हैं।

- **"आज का गल्ला"** वाला डिब्बा \`let\` जैसा है: दिन भर पैसे आते-जाते रहते हैं, वैल्यू बदलती रहती है।
- **दुकान के नाम का बोर्ड** \`const\` जैसा है: एक बार लगा दिया, रोज़ नहीं बदलते।
- \`var\` एक पुराना डिब्बा है जिसका लेबल कभी-कभी पूरी दुकान में दिख जाता है, गलत जगह पर भी।

डिब्बे के अंदर क्या है, वही **टाइप** है: चीनी, पैसे (number), "दुकान खुली है?" (boolean)। जो डिब्बा कभी भरा ही नहीं वह \`undefined\` है, और जिसे जानबूझकर खाली रखा वह \`null\` है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Bina variables ke program kuch yaad hi nahi rakh sakta. Socho Zomato ka cart: item ka price, quantity, coupon, total. Har cheez ko kahin store karna padega, naam se dobara padhna padega, aur update karna padega jab user quantity badhata hai.

**let/const kyun aaye?** Pehle sirf \`var\` tha, jo function-scoped hai aur hoisting ki wajah se ajeeb bugs deta tha (loop ke bahar bhi variable dikh jaata tha). 2015 (ES6) mein \`let\` aur \`const\` aaye jo **block-scoped** hain, yaani \`{ }\` ke andar hi rehte hain.

**Types kyun zaroori?** Kyunki operation type pe depend karta hai: \`"5" + 2\` deta hai \`"52"\` (string jod di), lekin \`5 + 2\` deta hai \`7\`. Agar type ka pata nahi, toh bill galat ban jaayega. Bahut saare real bugs isi confusion se aate hain.`,
          en: `Without variables a program cannot remember anything. Think of a food-delivery cart: price, quantity, coupon, total. Each must be stored, read back by name and updated when the user changes quantity.

**Why let/const?** Earlier only \`var\` existed. It is function-scoped and hoisted, which caused strange bugs such as a loop variable leaking outside the loop. ES6 (2015) added \`let\` and \`const\`, which are **block-scoped**.

**Why care about types?** Operations depend on type: \`"5" + 2\` gives \`"52"\`, while \`5 + 2\` gives \`7\`. Not knowing the type leads to wrong bills and many real bugs.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Har JavaScript app variables pe hi chalti hai, lekin kuch real examples dekho:

- **Swiggy / Zomato web app**: cart ka \`total\` \`let\` mein hota hai kyunki item add/remove pe badalta hai. API ka base URL \`const API_URL\` mein hota hai jo kabhi nahi badalta.
- **Razorpay checkout**: amount ko hamesha **number** (paise mein, integer) rakhte hain, string nahi. Agar form se \`"499"\` string aayi aur bina convert kiye jod di, toh amount \`"49950"\` ban sakta hai. Isliye wo \`Number()\` se convert karke validate karte hain.
- **IRCTC booking form**: \`const MAX_PASSENGERS = 6\` jaise constants, aur \`let selectedBerth = null\` jab tak user choose na kare.

Rule of thumb jo industry follow karti hai: **default \`const\`, jab reassign karna ho tab \`let\`, \`var\` kabhi nahi**. ESLint ka \`prefer-const\` rule bhi yahi bolta hai.`,
          en: `Every JavaScript app runs on variables. Some concrete examples:

- **Swiggy / Zomato web**: the cart \`total\` lives in a \`let\` because it changes as items are added. The API base URL is a \`const\`.
- **Razorpay checkout**: amounts are kept as **numbers** (in paise, integers), never strings. A string \`"499"\` added without conversion can become \`"49950"\`, so inputs are converted with \`Number()\` and validated.
- **IRCTC booking form**: constants like \`const MAX_PASSENGERS = 6\`, and \`let selectedBerth = null\` until the user picks one.

Industry rule: **\`const\` by default, \`let\` when you must reassign, never \`var\`**. ESLint's \`prefer-const\` enforces this.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Jab JS engine (jaise Chrome ka V8) tumhara code chalata hai, toh pehle ek **creation phase** hota hai jismein saare declarations memory mein register hote hain:

1. \`var\` waale variables ko memory milti hai aur turant value \`undefined\` set hoti hai. Isliye declaration se pehle padhoge toh error nahi, \`undefined\` milega (hoisting).
2. \`let\` aur \`const\` bhi register hote hain, lekin **Temporal Dead Zone (TDZ)** mein rehte hain. Declaration line se pehle access kiya toh \`ReferenceError\`.
3. Phir **execution phase** mein line by line values assign hoti hain.

**Primitive vs object**: primitive values (number, string, boolean...) seedhi copy hoti hain. Objects/arrays ka sirf **reference** (address) variable mein hota hai, asli data heap mein. Isliye \`const arr = []\` ke baad bhi \`arr.push(1)\` chalta hai: reference nahi badla, andar ka data badla.

\`typeof null\` \`"object"\` deta hai: yeh JavaScript ka 1995 ka purana bug hai jo compatibility ke liye kabhi fix nahi hua.`,
          en: `When an engine like V8 runs your code, it first has a **creation phase** where declarations are registered:

1. \`var\` variables get memory and are set to \`undefined\` immediately, so reading them before the declaration gives \`undefined\` (hoisting).
2. \`let\` and \`const\` are registered but stay in the **Temporal Dead Zone**; accessing them before their line throws \`ReferenceError\`.
3. In the **execution phase** values are assigned line by line.

Primitives are copied by value. Objects and arrays store only a **reference** in the variable, so \`const arr = []\` still allows \`arr.push(1)\`. \`typeof null === "object"\` is a historic bug kept for compatibility.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yeh code ek Zomato order ke variables banata hai aur unke types print karta hai:

- \`const appName\`: naam kabhi nahi badlega, isliye \`const\`.
- \`let orderCount\`: pehle 0, phir 3 kiya, isliye \`let\`.
- \`coupon = null\`: jaan-boojh ke khaali. \`deliveryBoy\` ko value di hi nahi, toh \`undefined\`.
- \`typeof\` har value ka type string mein batata hai. Dhyan do: \`typeof null\` \`"object"\` aata hai (purana bug).
- Last line coercion dikhati hai: \`"5" + 2\` string jodta hai (\`"52"\`), \`"5" - 2\` number mein badal ke ghatata hai (\`3\`).

Python version mein \`let/const\` nahi hote, bas naam = value; \`None\` JS ke \`null\` jaisa hai, aur Python \`"5" + 2\` pe error deta hai, isliye \`str()\`/\`int()\` se khud convert karna padta hai.`,
          en: `This code creates variables for a food order and prints their types:

- \`const appName\` never changes; \`let orderCount\` goes from 0 to 3.
- \`coupon = null\` is deliberately empty; \`deliveryBoy\` was never assigned, so it is \`undefined\`.
- \`typeof\` returns the type as a string. Note \`typeof null\` is \`"object"\`.
- The last line shows coercion: \`"5" + 2\` concatenates to \`"52"\`, \`"5" - 2\` converts to number and gives \`3\`.

Python has no let/const, \`None\` plays the role of \`null\`, and \`"5" + 2\` is an error there, so you convert explicitly.`,
        },
        codeJs: `const appName = "Zomato";
let orderCount = 0;
orderCount = orderCount + 3;
const price = 249.5;
const isPaid = true;
let coupon = null;
let deliveryBoy;

console.log(appName, orderCount, price, isPaid, coupon, deliveryBoy);
console.log(typeof appName, typeof orderCount, typeof isPaid);
console.log(typeof coupon, typeof deliveryBoy, typeof [1, 2]);
console.log("5" + 2, "5" - 2);`,
        codePython: `app_name = "Zomato"
order_count = 0
order_count = order_count + 3
price = 249.5
is_paid = True
coupon = None

print(app_name, order_count, price, is_paid, coupon)
print(type(app_name).__name__, type(order_count).__name__, type(is_paid).__name__)
print(type(coupon).__name__, type([1, 2]).__name__)
print("5" + str(2), int("5") - 2)`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Beginners ki common galtiyan:

- **\`const\` ko "value kabhi nahi badlegi" samajhna.** \`const\` sirf **reassignment** rokta hai. \`const user = {}\` ke baad \`user.name = "Riya"\` bilkul chalega.
- **\`var\` use karna.** Block ke bahar leak hota hai, aur loops + setTimeout mein galat values deta hai.
- **\`==\` se compare karna** jab type alag ho sakta hai. Hamesha \`===\` use karo.
- **Form input ko number samajhna.** \`input.value\` hamesha string hota hai. \`"10" + "5"\` = \`"105"\`. Pehle \`Number()\` karo.
- **\`null\` aur \`undefined\` mix karna.** \`undefined\` = abhi tak value nahi mili, \`null\` = maine khud khaali rakha.
- **\`typeof\` se array check karna.** \`typeof []\` \`"object"\` deta hai; array ke liye \`Array.isArray()\` use karo.
- Variable ka naam \`a\`, \`x1\`, \`data2\` rakhna. \`totalAmount\`, \`isLoggedIn\` jaise meaningful camelCase naam do.`,
          en: `Common beginner mistakes:

- Thinking \`const\` makes a value frozen. It only blocks **reassignment**; object properties can still change.
- Using \`var\`: it leaks out of blocks and misbehaves in loops with callbacks.
- Comparing with \`==\` when types may differ. Use \`===\`.
- Treating form input as a number. \`input.value\` is always a string; convert with \`Number()\`.
- Mixing up \`null\` (deliberately empty) and \`undefined\` (never assigned).
- Checking arrays with \`typeof\`; use \`Array.isArray()\`.
- Meaningless names like \`x1\`. Prefer \`totalAmount\`, \`isLoggedIn\`.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Variable aur type ke bugs aise pakdo:

1. **Value aur type dono print karo**: \`console.log(total, typeof total)\`. Aadhe bugs yahin pakde jaate hain ("arre, yeh toh string hai!").
2. **Error message dhyan se padho**:
   - \`ReferenceError: x is not defined\`: variable bana hi nahi, ya spelling galat hai.
   - \`ReferenceError: Cannot access 'x' before initialization\`: \`let/const\` ko declaration se pehle use kiya (TDZ).
   - \`TypeError: Assignment to constant variable\`: \`const\` ko dobara assign kiya, \`let\` chahiye tha.
3. **\`NaN\` aaya?** Kahin \`Number("abc")\` ya \`undefined + 1\` ho raha hai. \`Number.isNaN(x)\` se check karo.
4. **Browser DevTools** mein breakpoint lagao (Sources tab), aur Scope panel mein har variable ki current value dekho.
5. VS Code mein variable pe hover karo, ya TypeScript/JSDoc use karo taaki type galti editor hi pakad le.`,
          en: `How to catch variable and type bugs:

1. Print value **and** type: \`console.log(total, typeof total)\`.
2. Read the error:
   - \`x is not defined\`: never declared or misspelt.
   - \`Cannot access 'x' before initialization\`: used a let/const before its line (TDZ).
   - \`Assignment to constant variable\`: you needed \`let\`.
3. Seeing \`NaN\`? Something like \`Number("abc")\` or \`undefined + 1\` happened; check with \`Number.isNaN\`.
4. Use DevTools breakpoints and the Scope panel to watch values.
5. Let TypeScript or JSDoc catch type mistakes in the editor.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `**let vs const**: \`const\` padhne wale ko signal deta hai "yeh reassign nahi hoga", jisse code samajhna aasaan hota hai. Lekin counters, accumulators, loop variables ke liye \`let\` hi chahiye. Zabardasti sab kuch const banane ke liye code ulta-seedha mat karo.

**var kab?** Lagbhag kabhi nahi. Sirf purane codebase (2015 se pehle wale jQuery projects) padhte waqt samajhna zaroori hai.

**Dynamic typing ka trade-off**: jaldi likh sakte ho, flexible hai, lekin galat type ke bugs runtime pe hi pata chalte hain. Bade projects mein isliye **TypeScript** use hoti hai: type ki galti code chalane se pehle hi pakdi jaati hai. Chhoti scripts ke liye plain JS theek hai.

**Deep immutability chahiye?** \`const\` kaafi nahi. \`Object.freeze()\` (shallow) ya immutable patterns (spread se nayi copy) use karo.`,
          en: `**let vs const**: \`const\` tells readers "this will not be reassigned", which helps understanding. Counters and accumulators still need \`let\`; do not contort code to force \`const\`.

**var**: almost never, but you must read it in old codebases.

**Dynamic typing trade-off**: fast and flexible, but type bugs appear only at runtime. Large projects adopt **TypeScript** to catch them before running. Plain JS is fine for small scripts.

**Need real immutability?** \`const\` is not enough; use \`Object.freeze()\` (shallow) or create new copies with spread.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek real e-commerce project (jaise Meesho jaisa seller dashboard) mein variables aise dikhte hain:

\`\`\`js
// config.js
const API_BASE_URL = "https://api.example.com";
const MAX_CART_ITEMS = 20;

// cart.js
let cartTotal = 0;          // badlega
let appliedCoupon = null;   // abhi koi coupon nahi
\`\`\`

Upar ke saare "magic numbers" ek jagah \`UPPER_SNAKE_CASE\` constants mein rakhe jaate hain, taaki change ek jagah ho. Form se aane wali har value pehle convert aur validate hoti hai: \`const qty = Number(input.value); if (!Number.isInteger(qty)) ...\`.

Code review mein senior dev sabse pehle yahi pakadte hain: \`var\` mat use karo, \`let\` ki jagah \`const\` ho sakta hai, aur string ko number samajh ke jodna. ESLint + Prettier yeh sab automatically check karte hain CI mein.`,
          en: `In a real e-commerce dashboard, variables look like this: config values such as \`API_BASE_URL\` and \`MAX_CART_ITEMS\` live as \`UPPER_SNAKE_CASE\` constants in one file, while changing state like \`cartTotal\` uses \`let\` and \`appliedCoupon\` starts as \`null\`.

Every value from a form is converted and validated first, e.g. \`const qty = Number(input.value)\` followed by an integer check.

In code reviews, seniors flag \`var\`, \`let\` that could be \`const\`, and strings added as numbers. ESLint and Prettier enforce these rules automatically in CI.`,
        },
      },
    ],
    visualization: {
      kind: "CODE_EXECUTION",
      title: "Variables memory mein kaise bante hain",
      steps: [
        {
          title: "Creation phase",
          description: "Engine poora code scan karta hai. var a ko memory milti hai = undefined. let b aur const c register hote hain but TDZ mein (abhi touch nahi kar sakte).",
          highlight: "var a; let b; const c;",
        },
        {
          title: "a = 10 assign",
          description: "Execution shuru. a ki value undefined se 10 ho gayi. Type ab number hai.",
          highlight: "a = 10",
        },
        {
          title: "let b = 'chai'",
          description: "b TDZ se bahar aaya aur value 'chai' mili. Type string. Is line se pehle b padhte toh ReferenceError aata.",
          highlight: "let b = 'chai'",
        },
        {
          title: "const c = [1, 2]",
          description: "Array heap mein bana. c ke paas sirf uska reference (address) hai. c ko dobara assign nahi kar sakte.",
          highlight: "const c = [1, 2]",
        },
        {
          title: "c.push(3) allowed",
          description: "Reference wahi hai, sirf heap ka data badla: [1, 2, 3]. Isliye const array mein push chalta hai, lekin c = [] TypeError dega.",
          highlight: "c.push(3)",
        },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which keyword should you use by default for a variable that will never be reassigned?",
        options: ["var", "let", "const", "static"],
        correct: [2],
        explanation: "Default choice `const` hai. Yeh reader ko batata hai ki variable reassign nahi hoga. Jab value badalni ho tab `let`. `var` purana hai aur scope bugs deta hai, `static` toh variable keyword hi nahi hai.",
        tags: ["let-const"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `typeof null` return in JavaScript?",
        options: ['"null"', '"undefined"', '"object"', '"number"'],
        correct: [2],
        explanation: "`typeof null` ka answer `\"object\"` hai. Yeh JavaScript ka 1995 ka purana bug hai jo compatibility ki wajah se fix nahi kiya gaya. Null check karna ho toh `value === null` likho.",
        tags: ["typeof"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "What happens when you run `const x = 5; x = 6;`?",
        options: [
          "x becomes 6",
          "TypeError: Assignment to constant variable",
          "x silently stays 5",
          "SyntaxError before the code runs",
        ],
        correct: [1],
        explanation: "`const` reassignment allow nahi karta, toh runtime pe `TypeError: Assignment to constant variable` aata hai. JS silently ignore nahi karti (strict ya non-strict dono mein error aata hai const ke liye).",
        tags: ["const"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these are primitive types in JavaScript? (Select all that apply)",
        options: ["string", "array", "boolean", "undefined", "object", "bigint"],
        correct: [0, 2, 3, 5],
        explanation: "Primitives 7 hain: string, number, bigint, boolean, undefined, null, symbol. Array aur object primitive nahi hain, woh reference types hain (typeof dono ke liye `\"object\"`).",
        tags: ["types"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `console.log(a);
var a = 5;
let b = "10";
console.log(b + 5, b - 5);`,
        codeLanguage: "javascript",
        options: ["undefined\n105 5", "5\n15 5", "ReferenceError", "undefined\n15 5"],
        correct: [0],
        explanation: "`var a` hoist hota hai aur pehle se `undefined` set hota hai, isliye pehli line `undefined` print karti hai. `b` string \"10\" hai: `+` string jod deta hai (\"105\"), lekin `-` number mein convert karke 10 - 5 = 5 deta hai.",
        tags: ["hoisting", "coercion"],
      },
      {
        type: "SPOT_BUG",
        difficulty: 1,
        prompt: "This code should add 1+2+3 and print 6. What is the bug?",
        code: `const total = 0;
for (let i = 1; i <= 3; i++) {
  total = total + i;
}
console.log(total);`,
        codeLanguage: "javascript",
        options: [
          "The loop should start from 0",
          "total is declared with const but is reassigned inside the loop",
          "i should be declared with var",
          "console.log should be inside the loop",
        ],
        correct: [1],
        explanation: "`total` ki value har iteration mein badal rahi hai, matlab reassignment ho raha hai. `const` yeh allow nahi karta aur TypeError aayega. Fix: `let total = 0;`.",
        tags: ["const"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "A checkout page reads quantity from an input box and computes `qty + 1`. A user types 2, but the page shows 21. What is the best fix?",
        options: [
          "Use var instead of let for qty",
          "Convert the input with Number(input.value) before adding",
          "Use == instead of ===",
          "Wrap qty in a const",
        ],
        correct: [1],
        explanation: "Input box ki value hamesha **string** hoti hai. \"2\" + 1 = \"21\" (string jodna). Pehle `Number(input.value)` se number banao, phir validate karo, phir jodo. var/const se type nahi badalta.",
        tags: ["coercion"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Put these in the order the JS engine handles `let price = 99;` inside a script.",
        options: [
          "Engine scans the code and registers price in memory",
          "price sits in the Temporal Dead Zone (cannot be read yet)",
          "Execution reaches the line let price = 99",
          "price is initialised with the value 99",
          "Later lines can read price normally",
        ],
        explanation: "Pehle creation phase mein variable register hota hai par TDZ mein rehta hai. Jab execution us line pe pahunchta hai tab value milti hai, aur uske baad hi use kar sakte ho.",
        tags: ["tdz"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain why `const cart = []; cart.push('pizza');` works but `cart = ['burger'];` throws an error.",
        keywords: ["reference", "reassign", "heap", "mutate", "same array"],
        explanation: "`const` variable ke andar array ka reference (address) store hai. push same array ko mutate karta hai, reference nahi badalta, toh allowed hai. `cart = [...]` naya reference assign karna hai, yaani reassignment, jo const mein mana hai.",
        tags: ["const", "reference"],
      },
    ],
    buildTask: {
      title: "Type detective",
      description: `Ek function \`describeTypes(values)\` banao jo ek array leta hai aur har value ka **type naam** return karta hai.

Rules (JavaScript ke \`typeof\` jaise, lekin gotchas fix karke):
- number → \`"number"\`
- string → \`"string"\`
- boolean → \`"boolean"\`
- null → \`"null"\` (typeof wala bug nahi chahiye!)
- array → \`"array"\`
- baaki object → \`"object"\`

Example: \`describeTypes([1, "a", true, null, [1], {"x": 1}])\` → \`["number", "string", "boolean", "null", "array", "object"]\`

Python mein: \`True/False\` = boolean, \`None\` = null, list = array, dict = object. Dhyan do, Python mein \`bool\` bhi \`int\` ka subclass hai!`,
      functionName: "describeTypes",
      starterJs: `function describeTypes(values) {
  // return an array of type names
  return [];
}`,
      starterPython: `def describeTypes(values):
    # return a list of type names
    return []`,
      tests: [
        { name: "basic mix", args: [[1, "a", true, null, [1], { x: 1 }]], expected: ["number", "string", "boolean", "null", "array", "object"] },
        { name: "empty array", args: [[]], expected: [] },
        { name: "decimals and empty string", args: [[3.5, "", 0]], expected: ["number", "string", "number"] },
        { name: "nested arrays", args: [[[], [[1]], {}]], expected: ["array", "array", "object"] },
        { name: "false is boolean not number", args: [[false, 0, null]], expected: ["boolean", "number", "null"], hidden: true },
        { name: "strings that look like numbers", args: [["5", "true", "null"]], expected: ["string", "string", "string"], hidden: true },
      ],
      hints: [
        "typeof zyada tar kaam kar deta hai, bas do gotchas hain: typeof null 'object' deta hai aur typeof [] bhi 'object' deta hai.",
        "Har value pe loop chalao. Pehle null check karo, phir Array.isArray, phir baaki typeof se. Python mein bool ko int se pehle check karo.",
        "JS: if (v === null) return 'null'; if (Array.isArray(v)) return 'array'; return typeof v;  — Python: if v is None: ... elif isinstance(v, bool): ...",
      ],
      explainQuestions: [
        { question: "Why did you check for null before using typeof?", keywords: ["typeof null", "object", "bug"] },
        { question: "How did you tell an array apart from a normal object?", keywords: ["array.isarray", "typeof", "object"] },
        { question: "Why does the order of checks matter in Python for booleans?", keywords: ["bool", "subclass", "int", "isinstance"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "What is the difference between var, let and const?",
        short: "var is function-scoped and hoisted with an initial value of undefined, so it can be used before its declaration and leaks out of blocks. let and const are block-scoped and live in the temporal dead zone until declared. const additionally prevents reassignment, though objects it points to can still be mutated.",
        deep: `- **Scope**: \`var\` is function-scoped; \`let\`/\`const\` are block-scoped (\`{}\`).
- **Hoisting**: all three are hoisted, but \`var\` is initialised to \`undefined\` while \`let\`/\`const\` stay in the **Temporal Dead Zone**, so early access throws \`ReferenceError\`.
- **Redeclaration**: \`var x; var x;\` is allowed; \`let\` throws a SyntaxError.
- **Global object**: top-level \`var\` becomes a property of \`window\` in browsers; \`let\`/\`const\` do not.
- **const** blocks rebinding, not mutation: \`const a = []; a.push(1)\` is fine.

Classic example: \`for (var i...) setTimeout(() => log(i))\` prints the final value repeatedly, while \`let\` creates a fresh binding per iteration.`,
        followUps: [
          "What is the Temporal Dead Zone?",
          "How would you make an object truly immutable?",
          "Why does var inside a for loop with setTimeout print the same number?",
        ],
        commonMistake: "Saying const makes values immutable. It only prevents reassignment of the binding.",
        keywords: ["block scope", "function scope", "hoisting", "temporal dead zone", "reassignment"],
        difficulty: 1,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
      {
        question: "What is the difference between null and undefined?",
        short: "undefined means a variable has been declared but not assigned, or a property does not exist; the engine produces it. null is an explicit 'no value' that a developer assigns on purpose. typeof undefined is 'undefined' while typeof null is 'object' due to a historic bug, and null == undefined is true but null === undefined is false.",
        deep: `- \`undefined\`: default for unassigned variables, missing function arguments, missing object properties and functions without a return.
- \`null\`: intentional absence, e.g. \`let selectedSeat = null\` until the user chooses.
- \`null == undefined\` is \`true\` (loose equality special case); \`===\` is \`false\`.
- In JSON, \`undefined\` properties are dropped by \`JSON.stringify\`, but \`null\` is kept. This matters for APIs.
- \`??\` (nullish coalescing) treats both as missing.`,
        followUps: ["What does JSON.stringify do with undefined values?", "How does the ?? operator treat null and undefined?"],
        commonMistake: "Checking for null with typeof value === 'null', which never matches.",
        keywords: ["unassigned", "intentional", "typeof", "loose equality", "json"],
        difficulty: 1,
        roles: ["FRONTEND", "FULLSTACK", "SDE"],
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────────
  // 2. Operators and conditions
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "js-operators-conditions",
    estMinutes: 40,
    difficulty: 1,
    prerequisites: ["js-variables-types"],
    objectives: [
      "Arithmetic, comparison aur logical operators sahi se use karna",
      "== aur === ka farak aur truthy/falsy values samajhna",
      "if / else if / else, ternary aur switch se decisions likhna",
      "|| aur ?? (nullish coalescing) mein farak pehchanna",
    ],
    technicalDefinition:
      "Operators are symbols that compute a value from one or more operands, and conditional statements such as if, else and switch choose which block of code executes based on whether an expression evaluates to a truthy or falsy value.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Operators** woh symbols hain jo values pe kaam karte hain: \`+ - * / %\` (maths), \`=== !== > < >= <=\` (comparison), \`&& || !\` (logic), aur \`??\` (agar null/undefined ho toh default do).

**Conditions** program ko decision lene dete hain: "agar yeh sach hai toh yeh karo, warna woh karo". JavaScript mein iske liye \`if / else if / else\`, chhote decisions ke liye **ternary** \`condition ? a : b\`, aur bahut saare fixed cases ke liye \`switch\` hai.

Ek khaas baat: JS mein condition ko strictly \`true/false\` hona zaroori nahi. Har value ya toh **truthy** hai ya **falsy**. Falsy sirf yeh hain: \`false, 0, "", null, undefined, NaN\` (aur \`0n\`). Baaki sab truthy, even \`[]\` aur \`{}\`.`,
          en: `**Operators** are symbols that work on values: arithmetic (\`+ - * / %\`), comparison (\`=== !== > <\`), logical (\`&& || !\`) and nullish coalescing (\`??\`).

**Conditions** let a program make decisions: "if this is true do this, else do that". JavaScript offers \`if / else if / else\`, the **ternary** \`cond ? a : b\` for small choices, and \`switch\` for many fixed cases.

Conditions need not be strict booleans. Every value is **truthy** or **falsy**. The falsy values are \`false, 0, "", null, undefined, NaN\` (and \`0n\`); everything else, even \`[]\` and \`{}\`, is truthy.`,
          hi: `**ऑपरेटर** वे चिह्न हैं जो वैल्यू पर काम करते हैं: गणित के लिए \`+ - * / %\`, तुलना के लिए \`=== > <\`, तर्क के लिए \`&& || !\` और डिफ़ॉल्ट वैल्यू के लिए \`??\`।

**कंडीशन** प्रोग्राम को फ़ैसला लेने देती हैं: "अगर यह सच है तो यह करो, नहीं तो वह करो"। इसके लिए JavaScript में \`if / else\`, छोटे फ़ैसलों के लिए ternary और कई तय मामलों के लिए \`switch\` है।

JavaScript में हर वैल्यू या तो **truthy** होती है या **falsy**। Falsy केवल ये हैं: false, 0, खाली string, null, undefined और NaN। बाकी सब truthy हैं, खाली array भी।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Mumbai local train ka TC** socho. Har passenger ko dekh ke woh decide karta hai:

- **Agar** ticket hai **aur** (\`&&\`) ticket valid date ka hai → jaane do.
- **Warna agar** monthly pass hai → jaane do.
- **Warna** → fine lagao.

Yeh exactly \`if / else if / else\` hai. \`&&\` matlab "dono sach hone chahiye", \`||\` matlab "koi ek bhi sach ho toh chalega".

Ab \`==\` vs \`===\`: \`==\` woh lazy TC hai jo bolta hai "ticket ki photo phone mein hai? chalo theek hai" (type convert karke compare). \`===\` strict TC hai: "asli ticket dikhao, same type, same value". Production code mein hamesha strict TC chahiye.

Aur \`??\` aisa hai jaise chai wale bhaiya: "cheeni kitni? kuch nahi bataya toh default 2 chammach". Lekin agar tumne bola "0 chammach", toh woh 0 hi dalega, kyunki 0 ek valid jawab hai.`,
          en: `Think of a **local train ticket checker**. For each passenger he decides:

- **If** they have a ticket **and** (\`&&\`) it is for today, let them pass.
- **Else if** they have a monthly pass, let them pass.
- **Else**, fine them.

That is \`if / else if / else\`. \`&&\` needs both to be true; \`||\` needs at least one.

\`==\` is a lazy checker who converts types before comparing; \`===\` is strict: same type and same value. Use the strict one.

\`??\` is like a tea seller's default: no sugar preference given means 2 spoons, but if you say 0, you get 0.`,
          hi: `**मुंबई लोकल ट्रेन के टीसी** के बारे में सोचिए। हर यात्री को देखकर वह फ़ैसला करता है:

- **अगर** टिकट है **और** (\`&&\`) आज की तारीख का है, तो जाने दो।
- **नहीं तो अगर** मासिक पास है, तो जाने दो।
- **नहीं तो** जुर्माना लगाओ।

यही \`if / else if / else\` है। \`&&\` का मतलब है दोनों सच होने चाहिए, \`||\` का मतलब है कोई एक सच हो तो चलेगा।

\`==\` एक ढीला टीसी है जो टाइप बदलकर तुलना करता है, जबकि \`===\` सख़्त टीसी है: वही टाइप और वही वैल्यू। प्रोडक्शन कोड में हमेशा सख़्त वाला चाहिए।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Bina conditions ke har program ek seedhi line mein chalega, har user ke liye same. Lekin real apps mein har jagah decision hai:

- Swiggy: order ₹199 se upar hai toh delivery free, warna ₹30.
- IRCTC: seat available hai toh confirm, warna waitlist.
- Login: password match kiya toh dashboard, warna error.

Operators in decisions ke liye data taiyaar karte hain: total nikaalna (\`+\`, \`*\`), compare karna (\`>=\`), multiple rules jodna (\`&&\`, \`||\`).

**\`===\` kyun?** Kyunki \`==\` type badal ke compare karta hai aur ajeeb results deta hai: \`0 == ""\` true, \`"1" == 1\` true, \`null == 0\` false. Aise surprises payment ya auth logic mein security bug ban sakte hain.

**\`??\` kyun aaya?** Kyunki \`||\` har falsy value ko "missing" maan leta hai, toh \`quantity || 1\` mein 0 quantity bhi 1 ban jaati thi. \`??\` sirf \`null/undefined\` ko missing maanta hai.`,
          en: `Without conditions every program would run the same straight line for every user. Real apps decide constantly: free delivery above ₹199, confirmed seat or waitlist, dashboard or login error.

Operators prepare the data for those decisions: compute totals, compare values, combine rules with \`&&\` and \`||\`.

**Why \`===\`?** \`==\` converts types and gives surprises like \`0 == ""\` being true. In payment or auth logic that can become a security bug.

**Why \`??\`?** \`||\` treats every falsy value as missing, so \`quantity || 1\` turns a real 0 into 1. \`??\` only replaces \`null\` and \`undefined\`.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Swiggy / Zomato**: delivery fee, surge pricing aur coupon eligibility sab conditions hain: \`if (cartTotal >= 199 && !isRaining) fee = 0;\`. Ternary se UI text: \`isOpen ? "Order now" : "Opens at 7 PM"\`.
- **PhonePe / Google Pay (UPI)**: payment se pehle checks: amount > 0, amount <= daily limit, PIN sahi hai. Har check ek \`if\` hai jo galat hone pe jaldi return kar deta hai (guard clause).
- **React apps (Flipkart web)**: conditional rendering \`{cart.length > 0 && <CheckoutButton />}\` mein \`&&\` ka short-circuit use hota hai. Config defaults ke liye \`props.pageSize ?? 20\`.

\`switch\` aksar order status ke liye dikhta hai: \`"PLACED"\`, \`"PREPARING"\`, \`"OUT_FOR_DELIVERY"\`, \`"DELIVERED"\` — har status ka alag message.`,
          en: `- **Swiggy / Zomato**: delivery fees, surge pricing and coupon eligibility are conditions like \`if (cartTotal >= 199 && !isRaining) fee = 0;\`, and UI labels use ternaries.
- **UPI apps (PhonePe, Google Pay)**: before paying they check amount > 0, within daily limit and correct PIN, each as an early-return guard.
- **React apps (Flipkart web)**: conditional rendering \`{cart.length > 0 && <Checkout />}\` uses short-circuit \`&&\`; defaults use \`??\`.

\`switch\` often maps order statuses such as \`PLACED\`, \`PREPARING\`, \`DELIVERED\` to messages.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Andar kya hota hai:

1. **Expression evaluate hota hai**: \`cartTotal >= 199\` ek boolean deta hai. Agar condition mein koi aur value hai (jaise \`items.length\`), toh engine use **ToBoolean** rule se truthy/falsy mein badalta hai.
2. **Short-circuit**: \`a && b\` mein agar \`a\` falsy hai toh \`b\` chalta hi nahi, aur result \`a\` hota hai. \`a || b\` mein agar \`a\` truthy hai toh \`b\` skip. Yeh operators boolean nahi, **operand khud return** karte hain: \`0 || 50\` = 50, \`"Riya" && "hi"\` = "hi".
3. **\`===\`** pehle type check karta hai; type alag toh seedha false. **\`==\`** "Abstract Equality" algorithm chalata hai: string ko number mein badalna, boolean ko number, etc.
4. **\`switch\`** \`===\` se case match karta hai, aur \`break\` na ho toh agle case mein **fall through** ho jaata hai.
5. **Precedence**: \`*\` pehle \`+\` se, comparison pehle \`&&\` se, \`&&\` pehle \`||\` se. Doubt ho toh brackets lagao.`,
          en: `Under the hood:

1. The condition is evaluated; non-boolean values go through **ToBoolean** to become truthy or falsy.
2. **Short-circuit**: in \`a && b\`, if \`a\` is falsy \`b\` never runs. These operators return an **operand**, not a boolean: \`0 || 50\` is 50.
3. \`===\` compares type first and returns false on mismatch; \`==\` runs coercion rules (string to number, boolean to number).
4. \`switch\` matches with \`===\` and **falls through** without \`break\`.
5. Precedence: \`*\` before \`+\`, comparisons before \`&&\`, \`&&\` before \`||\`. Use brackets when unsure.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yeh code ek food app ka delivery fee aur order message decide karta hai:

- \`deliveryFee()\` mein **guard clause**: total 0 ya kam ho toh turant \`-1\` return. Phir \`if / else if / else\` se fee decide.
- \`&&\` se do conditions jodi: total 199+ **aur** baarish nahi.
- \`statusMessage()\` mein \`switch\`, har case ke baad \`return\` hai isliye \`break\` ki zaroorat nahi.
- \`coupon ?? "NONE"\`: sirf null/undefined pe default. \`0 || 10\` vs \`0 ?? 10\` ka farak last line mein dikh raha hai.

Python mein \`elif\` hota hai, \`&&\` ki jagah \`and\`, aur \`??\` nahi hai, toh \`x if x is not None else default\` likhte hain. Python 3.10+ mein \`match\` statement switch jaisa hai.`,
          en: `This code decides a delivery fee and a status message:

- \`deliveryFee()\` starts with a **guard clause**, then uses \`if / else if / else\`.
- \`&&\` combines two conditions.
- \`statusMessage()\` uses \`switch\`; each case returns, so no \`break\` is needed.
- \`coupon ?? "NONE"\` defaults only for null/undefined; the last line contrasts \`||\` and \`??\`.

Python uses \`elif\`, \`and\`, a conditional expression instead of \`??\`, and \`match\` (3.10+) for switch-like logic.`,
        },
        codeJs: `function deliveryFee(total, isRaining) {
  if (total <= 0) return -1; // guard clause
  if (total >= 199 && !isRaining) {
    return 0;
  } else if (total >= 199) {
    return 20;
  } else {
    return 40;
  }
}

function statusMessage(status) {
  switch (status) {
    case "PLACED": return "Order mil gaya";
    case "OUT_FOR_DELIVERY": return "Rider raste mein hai";
    case "DELIVERED": return "Enjoy your meal";
    default: return "Unknown status";
  }
}

console.log(deliveryFee(250, false), deliveryFee(250, true), deliveryFee(120, false));
console.log(statusMessage("OUT_FOR_DELIVERY"));
const coupon = null;
console.log(coupon ?? "NONE", 250 > 199 ? "free delivery" : "paid");
console.log(0 || 10, 0 ?? 10, "5" == 5, "5" === 5);`,
        codePython: `def delivery_fee(total, is_raining):
    if total <= 0:
        return -1  # guard clause
    if total >= 199 and not is_raining:
        return 0
    elif total >= 199:
        return 20
    else:
        return 40

def status_message(status):
    match status:
        case "PLACED":
            return "Order mil gaya"
        case "OUT_FOR_DELIVERY":
            return "Rider raste mein hai"
        case "DELIVERED":
            return "Enjoy your meal"
        case _:
            return "Unknown status"

print(delivery_fee(250, False), delivery_fee(250, True), delivery_fee(120, False))
print(status_message("OUT_FOR_DELIVERY"))
coupon = None
print(coupon if coupon is not None else "NONE", "free delivery" if 250 > 199 else "paid")
print(0 or 10, "5" == 5)`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `- **\`=\` vs \`===\`**: \`if (x = 5)\` assignment hai, comparison nahi! Yeh hamesha truthy hoga aur x ko 5 bana dega.
- **\`==\` use karna**: \`"" == 0\` true hai. Hamesha \`===\` aur \`!==\`.
- **\`||\` se default dena jab 0 ya "" valid ho**: \`const qty = input || 1\` mein 0 bhi 1 ban jaayega. \`??\` use karo.
- **Empty array ko falsy samajhna**: \`if (cart)\` khaali array pe bhi true hai. \`if (cart.length > 0)\` likho.
- **switch mein \`break\` bhoolna**: neeche ke saare cases chal jaate hain (fall-through).
- **NaN compare karna**: \`x === NaN\` hamesha false. \`Number.isNaN(x)\` use karo.
- **Range check galat likhna**: \`if (0 < marks < 100)\` JS mein galat hai (\`(0 < marks)\` boolean ban jaata hai, phir \`true < 100\`). Likho: \`marks > 0 && marks < 100\`.
- **Bahut gehri nesting**: 5 level ke if-else. Guard clauses aur early return se flat rakho.`,
          en: `- \`if (x = 5)\` assigns instead of comparing and is always truthy.
- Using \`==\`: \`"" == 0\` is true. Use \`===\`.
- Using \`||\` for defaults when 0 or "" are valid; use \`??\`.
- Treating \`[]\` as falsy; check \`.length\`.
- Forgetting \`break\` in \`switch\` causes fall-through.
- \`x === NaN\` is always false; use \`Number.isNaN\`.
- \`0 < marks < 100\` does not work as in maths; write \`marks > 0 && marks < 100\`.
- Deep nesting; prefer guard clauses and early returns.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Condition galat branch mein jaa rahi hai? Aise debug karo:

1. **Condition ko alag variable mein todo**: \`const isEligible = total >= 199 && !isRaining; console.log({ total, isRaining, isEligible });\`. Object shorthand se naam + value dono dikhenge.
2. **Har operand ka type check karo**: \`total\` string toh nahi? \`"250" >= 199\` coerce hoke true deta hai, lekin \`"250" > "1000"\` string comparison mein true aata hai!
3. **Truthiness test karo**: \`console.log(Boolean(value))\` se pata chalega ki value truthy hai ya falsy.
4. **DevTools mein conditional breakpoint**: line number pe right-click → "Add conditional breakpoint" → \`total > 1000\`. Sirf tab rukega jab woh case aaye.
5. **switch kaam nahi kar raha?** Yaad rakho woh \`===\` se match karta hai: \`switch (status)\` mein status \`"placed"\` (lowercase) hai aur case \`"PLACED"\` hai toh match nahi hoga.
6. ESLint ka \`eqeqeq\` aur \`no-cond-assign\` rule on karo, yeh galtiyan likhte waqt hi pakad lega.`,
          en: `When a condition takes the wrong branch:

1. Pull it into a variable and log it with context: \`console.log({ total, isRaining, isEligible })\`.
2. Check operand types: string comparison \`"250" > "1000"\` is true.
3. Test truthiness with \`Boolean(value)\`.
4. Use a conditional breakpoint in DevTools, e.g. \`total > 1000\`.
5. \`switch\` matches with \`===\`, so casing and types must be exact.
6. Enable ESLint \`eqeqeq\` and \`no-cond-assign\`.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **if/else vs ternary**: ternary ek chhoti value choose karne ke liye badhiya hai (\`isOpen ? "Open" : "Closed"\`). Nested ternary (\`a ? b : c ? d : e\`) padhna mushkil hai, wahan if/else lo.
- **if/else chain vs switch**: fixed values (status, role) pe switch saaf lagta hai. Ranges (\`marks >= 90\`) ke liye if/else hi sahi hai.
- **switch vs lookup object**: bahut saare cases ho toh object map aur bhi saaf hai: \`const msg = { PLACED: "...", DELIVERED: "..." }[status] ?? "Unknown";\`. Naya status = ek line add.
- **\`||\` vs \`??\`**: jab 0, "" ya false valid values ho sakti hain, \`??\` lo. Jab koi bhi falsy value "empty" maani jaaye (jaise khaali naam), \`||\` theek hai.
- **\`==\` kabhi?** Sirf ek accepted idiom: \`x == null\` jo null aur undefined dono pakadta hai. Baaki jagah \`===\`.`,
          en: `- **Ternary vs if/else**: ternaries suit small value choices; nested ternaries hurt readability.
- **if/else vs switch**: switch fits fixed values; ranges need if/else.
- **switch vs lookup object**: for many cases, a map like \`{ PLACED: "..." }[status] ?? "Unknown"\` is cleaner and easy to extend.
- **\`||\` vs \`??\`**: use \`??\` when 0, "" or false are valid.
- **\`==\`**: only the idiom \`x == null\` (matches null and undefined) is widely accepted.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real backend (jaise ek Express API jo coupon apply karti hai) mein conditions **guard clauses** ke roop mein dikhti hain:

\`\`\`js
function applyCoupon(cart, coupon) {
  if (!coupon) return { ok: false, reason: "NO_COUPON" };
  if (coupon.expired) return { ok: false, reason: "EXPIRED" };
  if (cart.total < coupon.minOrder) return { ok: false, reason: "MIN_ORDER" };
  return { ok: true, discount: coupon.flat ?? 0 };
}
\`\`\`

Har galat case pehle hi return ho jaata hai, aur "happy path" last mein flat rehta hai. Isse code padhna aur test karna aasaan hai: har \`if\` ke liye ek test case.

Frontend pe \`??\` se API defaults (\`user.name ?? "Guest"\`) aur ternary se button labels. Code review mein \`==\`, nested ternary, aur 4+ level nesting turant flag hote hain.`,
          en: `In a real coupon API, conditions appear as **guard clauses**: return early for missing coupon, expired coupon, or minimum order not met, and keep the happy path flat at the end. Each \`if\` maps to one test case, which keeps testing simple.

On the frontend, \`??\` supplies API defaults like \`user.name ?? "Guest"\` and ternaries choose button labels. Reviewers flag \`==\`, nested ternaries and deep nesting.`,
        },
      },
    ],
    visualization: {
      kind: "FLOW",
      title: "Delivery fee decision flow",
      steps: [
        { title: "Input aaya", description: "total = 250, isRaining = true. Function deliveryFee(total, isRaining) call hua.", highlight: "deliveryFee(250, true)" },
        { title: "Guard clause", description: "total <= 0? 250 <= 0 false hai, toh aage badho. Agar true hota toh yahin -1 return.", highlight: "if (total <= 0)" },
        { title: "Pehli condition (&&)", description: "total >= 199 true hai, lekin !isRaining false hai. && mein dono true chahiye, toh poori condition false.", highlight: "total >= 199 && !isRaining" },
        { title: "else if", description: "total >= 199 true hai, toh yeh branch chalegi aur 20 return hoga. Neeche ka else check hi nahi hota.", highlight: "else if (total >= 199)" },
        { title: "Result", description: "Function 20 return karta hai. Sirf ek branch chali, baaki skip.", highlight: "return 20" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the value of `\"5\" === 5`?",
        options: ["true", "false", "TypeError", "undefined"],
        correct: [1],
        explanation: "`===` strict equality hai: pehle type compare karta hai. String aur number alag types hain, toh seedha `false`. `==` hota toh type convert karke `true` deta.",
        tags: ["equality"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which of these values is truthy?",
        options: ["0", '""', "[]", "null"],
        correct: [2],
        explanation: "Khaali array `[]` truthy hai! Falsy sirf false, 0, \"\", null, undefined, NaN (aur 0n) hain. Isliye cart empty check ke liye `cart.length === 0` likhte hain.",
        tags: ["truthy-falsy"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "A user sets quantity to 0. Which line keeps 0 instead of replacing it with 1?",
        options: ["const q = qty || 1;", "const q = qty ?? 1;", "const q = qty && 1;", "const q = !qty ? 1 : qty;"],
        correct: [1],
        explanation: "`??` sirf null/undefined pe default lagata hai, 0 ko valid value maanta hai. `||` har falsy (0 bhi) ko replace kar deta hai, aur `!qty` bhi 0 ko true maanega.",
        tags: ["nullish"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which statements about `&&` and `||` are correct? (Select all that apply)",
        options: [
          "They always return true or false",
          "`a && b` does not evaluate b if a is falsy",
          "`a || b` returns a if a is truthy",
          "`&&` has higher precedence than `||`",
        ],
        correct: [1, 2, 3],
        explanation: "&& aur || short-circuit karte hain aur boolean nahi, operand khud return karte hain (`0 || 50` = 50). Aur && ki precedence || se zyada hai, toh `a || b && c` = `a || (b && c)`.",
        tags: ["logical"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `console.log(0 == "0", 0 === "0");
console.log(0 || 50, 0 ?? 50);`,
        codeLanguage: "javascript",
        options: ["true false\n50 0", "true false\n50 50", "false false\n0 0", "true true\n50 0"],
        correct: [0],
        explanation: "`0 == \"0\"` mein string number ban jaati hai, toh true; `===` type alag dekh ke false. `0 || 50`: 0 falsy hai toh 50. `0 ?? 50`: 0 null/undefined nahi hai, toh 0 hi rehta hai.",
        tags: ["equality", "nullish"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `const items = [];
if (items) {
  console.log("cart has items");
} else {
  console.log("cart empty");
}
console.log(items.length ? "show" : "hide");`,
        codeLanguage: "javascript",
        options: ["cart empty\nhide", "cart has items\nhide", "cart has items\nshow", "cart empty\nshow"],
        correct: [1],
        explanation: "`[]` truthy hai, toh pehla `if` chal jaata hai aur \"cart has items\" print hota hai (yeh bug hai!). `items.length` 0 hai jo falsy hai, toh ternary \"hide\" deta hai. Sahi check `.length` wala hai.",
        tags: ["truthy-falsy"],
      },
      {
        type: "FILL_CODE",
        difficulty: 2,
        prompt: "Fill the blank so free delivery applies only when the total is at least 199 AND the user is a Gold member.",
        code: `if (total >= 199 ____ isGold) {
  fee = 0;
}`,
        codeLanguage: "javascript",
        options: ["||", "&&", "??", "=="],
        correct: [1],
        explanation: "\"Dono shart sach honi chahiye\" = `&&`. `||` se koi ek bhi sach hone pe free delivery mil jaati, jo galat hai.",
        tags: ["logical"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the checks a UPI payment function should run, from first to last.",
        options: [
          "Return an error if amount is missing or not a number",
          "Return an error if amount is less than or equal to 0",
          "Return an error if amount is above the daily limit",
          "Return an error if the PIN does not match",
          "Process the payment (happy path)",
        ],
        explanation: "Guard clauses ka pattern: sabse basic validation (value hai ya nahi) pehle, phir business rules (limit), phir auth (PIN), aur end mein happy path. Har galat case jaldi return ho jaata hai.",
        tags: ["guard-clause"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain why `if (0 < marks < 100)` does not correctly check if marks is between 0 and 100 in JavaScript, and how to fix it.",
        keywords: ["left to right", "boolean", "true < 100", "&&", "coerced"],
        explanation: "Comparison left to right chalta hai: `0 < marks` pehle ek boolean deta hai, phir `true < 100` mein true 1 ban jaata hai (coerced), toh hamesha true. Sahi: `marks > 0 && marks < 100`.",
        tags: ["comparison"],
      },
    ],
    buildTask: {
      title: "Exam grade calculator",
      description: `Ek function \`gradeFor(marks)\` banao jo marks (0 se 100) leke grade return kare:

- 90 ya usse zyada → \`"A"\`
- 75 se 89 → \`"B"\`
- 50 se 74 → \`"C"\`
- 50 se kam → \`"F"\`
- Agar marks number nahi hai, ya 0 se kam / 100 se zyada hai → \`"INVALID"\`

Guard clause se invalid case pehle handle karo, phir \`if / else if\` chain.`,
      functionName: "gradeFor",
      starterJs: `function gradeFor(marks) {
  // return "A", "B", "C", "F" or "INVALID"
  return "";
}`,
      starterPython: `def gradeFor(marks):
    # return "A", "B", "C", "F" or "INVALID"
    return ""`,
      tests: [
        { name: "top score", args: [95], expected: "A" },
        { name: "exact 90 boundary", args: [90], expected: "A" },
        { name: "B grade", args: [75], expected: "B" },
        { name: "C grade", args: [50], expected: "C" },
        { name: "fail", args: [49], expected: "F" },
        { name: "out of range", args: [101], expected: "INVALID", hidden: true },
        { name: "string is invalid", args: ["85"], expected: "INVALID", hidden: true },
      ],
      hints: [
        "Pehle invalid input reject karo (guard clause), phir upar se neeche (90, 75, 50) boundaries check karo.",
        "typeof marks !== 'number' ya marks < 0 ya marks > 100 ho toh 'INVALID'. Uske baad >= 90, >= 75, >= 50 order mein check karo.",
        "if (typeof marks !== 'number' || marks < 0 || marks > 100) return 'INVALID'; if (marks >= 90) return 'A'; ...",
      ],
      explainQuestions: [
        { question: "Why does the order of the >= checks matter?", keywords: ["first match", "higher", "else if", "boundary"] },
        { question: "How did you handle a string like '85'?", keywords: ["typeof", "number", "invalid"] },
        { question: "What is a guard clause and why use it here?", keywords: ["early return", "invalid", "nesting"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "What is the difference between == and === in JavaScript?",
        short: "=== is strict equality: it returns true only if both type and value match, with no conversion. == is loose equality: it converts operands to a common type first, which leads to surprising results like 0 == '' being true. In production code we use === everywhere, with x == null as the only common exception to catch both null and undefined.",
        deep: `- \`===\`: if types differ, result is \`false\` immediately. \`NaN === NaN\` is still false.
- \`==\`: runs the Abstract Equality algorithm: \`null == undefined\` is true, strings and booleans are converted to numbers, objects to primitives.
- Surprising cases: \`"" == 0\`, \`"0" == false\`, \`[] == false\` are all \`true\`.
- Objects compare by reference in both: \`{} === {}\` is false.
- Use \`Object.is\` when you need \`NaN\` equal to itself or to distinguish \`+0\` and \`-0\`.`,
        followUps: ["Why is NaN === NaN false?", "How are two objects compared with ===?", "When is == null acceptable?"],
        commonMistake: "Saying === compares 'more carefully' without mentioning that == performs type coercion.",
        keywords: ["strict equality", "type coercion", "loose equality", "reference", "nan"],
        difficulty: 1,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
      {
        question: "What is the difference between || and ?? ?",
        short: "|| returns the right side when the left side is any falsy value, including 0, empty string and false. ?? returns the right side only when the left side is null or undefined. So for defaults where 0 or an empty string are valid, like quantity or a discount, ?? is the correct operator.",
        deep: `- \`count || 10\` turns \`0\` into \`10\`; \`count ?? 10\` keeps \`0\`.
- Both short-circuit: the right side is not evaluated if not needed.
- \`??\` cannot be mixed with \`||\`/\`&&\` without parentheses (SyntaxError).
- Related: \`??=\` assigns only if the variable is nullish, and optional chaining \`?.\` pairs naturally: \`user?.settings?.theme ?? "light"\`.`,
        followUps: ["What does ??= do?", "Why can't you write a || b ?? c without brackets?"],
        commonMistake: "Using || for numeric defaults and silently overwriting a valid 0.",
        keywords: ["falsy", "nullish", "null", "undefined", "default value"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "SDE"],
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────────
  // 3. Loops
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "js-loops",
    estMinutes: 40,
    difficulty: 1,
    prerequisites: ["js-operators-conditions"],
    objectives: [
      "for, while, do...while, for...of aur for...in mein farak samajhna",
      "break aur continue se loop control karna",
      "Off-by-one aur infinite loop jaise bugs pehchanna",
      "Sahi problem ke liye sahi loop choose karna",
    ],
    technicalDefinition:
      "A loop is a control-flow construct that repeatedly executes a block of code while a condition holds or once for each element of an iterable, with for, while, do...while, for...of and for...in as JavaScript's loop statements.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Loop** ek tareeka hai ek hi kaam ko baar-baar karne ka, bina code copy-paste kiye. JavaScript mein main loops:

- \`for (let i = 0; i < n; i++)\`: jab pata ho kitni baar chalana hai.
- \`while (condition)\`: jab tak condition sach hai tab tak chalo.
- \`do...while\`: kam se kam ek baar zaroor chalega, phir condition check.
- \`for...of\`: array/string ki har **value** pe chalo (sabse zyada use hota hai).
- \`for...in\`: object ki har **key** pe chalo.

\`break\` loop ko turant rok deta hai, \`continue\` current round skip karke agle pe chala jaata hai.`,
          en: `A **loop** repeats a piece of work without copy-pasting code. JavaScript's main loops:

- \`for (let i = 0; i < n; i++)\`: when you know how many times.
- \`while (condition)\`: repeat while the condition is true.
- \`do...while\`: runs at least once, then checks.
- \`for...of\`: each **value** of an array or string.
- \`for...in\`: each **key** of an object.

\`break\` stops the loop immediately; \`continue\` skips to the next round.`,
          hi: `**लूप** एक ही काम को बार-बार करने का तरीका है, बिना कोड कॉपी-पेस्ट किए। JavaScript के मुख्य लूप:

- \`for\`: जब पता हो कितनी बार चलाना है।
- \`while\`: जब तक शर्त सच है तब तक चलो।
- \`do...while\`: कम से कम एक बार ज़रूर चलेगा, फिर शर्त जाँचेगा।
- \`for...of\`: array या string की हर **वैल्यू** पर चलो।
- \`for...in\`: object की हर **key** पर चलो।

\`break\` लूप को तुरंत रोक देता है और \`continue\` मौजूदा चक्कर छोड़कर अगले पर चला जाता है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Cricket ka over** socho. Bowler ko 6 legal balls daalni hain:

- \`for (let ball = 1; ball <= 6; ball++)\`: pata hai exactly 6 balls, counter chal raha hai. Yeh **for loop** hai.
- **Wide ball** pe ball count nahi hoti, bowler dobara daalta hai. Yeh \`continue\` jaisa hai: yeh round count mat karo, aage badho.
- **Baarish aa gayi**, match beech mein ruk gaya: yeh \`break\` hai.
- **Super over / tie-breaker**: "jab tak winner decide nahi hota, khelte raho" — yeh \`while\` loop hai, pehle se pata nahi kitne rounds.

Aur \`for...of\` aisa hai jaise team sheet pe har player ka naam ek-ek karke padhna, jabki \`for...in\` jersey numbers (keys) padhna hai.

Infinite loop? Woh bowler jo over khatam hone ka count hi nahi badhata, aur match kabhi khatam nahi hota.`,
          en: `Think of a **cricket over**: the bowler must deliver 6 legal balls.

- Counting balls 1 to 6 is a **for loop**.
- A **wide** does not count and the ball is bowled again, like \`continue\`.
- **Rain** stops the match midway, like \`break\`.
- A **super over** played until there is a winner is a \`while\` loop: you do not know the number of rounds in advance.

\`for...of\` reads each player's name from the team sheet; \`for...in\` reads the jersey numbers (keys). An infinite loop is a bowler who never updates the ball count.`,
          hi: `**क्रिकेट का ओवर** सोचिए। गेंदबाज़ को 6 सही गेंदें डालनी हैं:

- 1 से 6 तक गेंदें गिनना **for लूप** है।
- **वाइड** गेंद गिनी नहीं जाती और दोबारा डाली जाती है, यह \`continue\` जैसा है।
- **बारिश** आ गई और मैच बीच में रुक गया, यह \`break\` है।
- **सुपर ओवर**, जब तक विजेता तय नहीं होता खेलते रहो, यह \`while\` लूप है।

\`for...of\` टीम शीट से हर खिलाड़ी का नाम एक-एक करके पढ़ना है, और \`for...in\` जर्सी नंबर (keys) पढ़ना है। अनंत लूप वह गेंदबाज़ है जो गिनती कभी नहीं बढ़ाता।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Socho tumhare paas Flipkart ke 10,000 products hain aur har product pe 10% discount lagana hai. Bina loop ke 10,000 lines likhoge? Impossible.

Loops isliye exist karte hain:
- **Repetition**: same kaam har item pe (har order ka total, har student ka result).
- **Unknown count**: user jab tak sahi OTP nahi daalta (max 3 tries) tab tak poochte raho.
- **Search**: list mein pehla match milte hi ruk jao (\`break\`).
- **Aggregation**: sab values jod ke total, max, average nikaalna.

Alag-alag loops isliye hain kyunki problems alag hain: index chahiye (\`for\`), sirf values chahiye (\`for...of\`), keys chahiye (\`for...in\`), ya pata hi nahi kitni baar (\`while\`). Sahi loop choose karne se code chhota aur bug-free rehta hai.`,
          en: `Imagine 10,000 products that each need a 10% discount. Writing 10,000 lines is impossible, so loops exist for:

- **Repetition**: the same work for every item.
- **Unknown counts**: keep asking for the OTP until it is right (max 3 tries).
- **Search**: stop at the first match with \`break\`.
- **Aggregation**: totals, maximums, averages.

Different loops fit different needs: an index (\`for\`), only values (\`for...of\`), keys (\`for...in\`), or an unknown number of rounds (\`while\`). Picking the right one keeps code short and bug-free.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Zomato restaurant page**: menu ke har item pe loop chala ke card banaya jaata hai. React mein yeh \`items.map()\` hota hai, jo andar se loop hi hai.
- **Paytm / bank statement export**: har transaction pe loop chala ke CSV line banti hai, aur running balance calculate hota hai.
- **OTP retry (UPI apps)**: \`while (attempts < 3 && !verified)\` jaisa logic, 3 galat attempts pe \`break\` aur account lock.
- **Backend jobs (Node.js)**: database se 1000-1000 records ke batches mein data uthana: "jab tak aur records hain, agla batch lao" — \`while\` loop with pagination.

Real codebases mein simple arrays pe \`for...of\` aur array methods (\`map\`, \`filter\`, \`reduce\`) zyada dikhte hain, aur classic \`for (let i...)\` tab jab index chahiye ya performance-critical code ho.`,
          en: `- **Zomato menu**: a loop renders a card per item; in React that is \`items.map()\`.
- **Paytm statement export**: loop over transactions to build CSV lines and a running balance.
- **UPI OTP retry**: \`while (attempts < 3 && !verified)\` with a lock after three failures.
- **Node.js batch jobs**: fetch records in batches of 1000 while more exist.

Modern code mostly uses \`for...of\` and array methods; classic \`for\` appears when the index is needed or performance matters.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `\`for (let i = 0; i < 3; i++) { body }\` ka exact order:

1. **Init**: \`let i = 0\` sirf ek baar chalta hai.
2. **Condition check**: \`i < 3\`? false hua toh loop khatam.
3. **Body** chalti hai.
4. **Update**: \`i++\`.
5. Wapas step 2 pe.

\`let\` ke saath har iteration ko **naya \`i\` binding** milta hai, isliye loop ke andar bane callbacks apni-apni value yaad rakhte hain. \`var\` mein ek hi shared \`i\` hota hai.

\`for...of\` andar se **iterator protocol** use karta hai: array ka \`[Symbol.iterator]()\` call hota hai jo \`next()\` se \`{ value, done }\` deta rehta hai jab tak \`done: true\` na ho. Isliye yeh strings, Maps, Sets sab pe chalta hai.

\`for...in\` object ki **enumerable string keys** pe chalta hai, prototype se inherited keys bhi aa sakti hain. Isliye arrays pe for...in mat chalao: indexes \`"0", "1"\` strings milenge.`,
          en: `For \`for (let i = 0; i < 3; i++)\`: init runs once, then condition check, body, update, and back to the check until it is false.

With \`let\`, every iteration gets a **fresh binding** of \`i\`, so callbacks created in the loop remember their own value; \`var\` shares one.

\`for...of\` uses the **iterator protocol**: it calls \`[Symbol.iterator]()\` and \`next()\` until \`done\` is true, which is why it works on strings, Maps and Sets.

\`for...in\` walks **enumerable string keys**, including inherited ones, so on arrays you get index strings like "0". Avoid it for arrays.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yeh code paanch loops ek saath dikhata hai:

- Classic \`for\`: 1 se 6 balls, wide (ball 3) pe \`continue\` karke skip.
- \`for...of\`: har order amount jod ke total nikaala.
- \`while\`: OTP attempts, sahi OTP milte hi \`break\`.
- \`for...in\`: object ki keys (player names) aur unke runs.
- \`do...while\`: condition shuru se false hai, phir bhi ek baar chala.

Python mein \`for i in range(1, 7)\` classic for jaisa hai, \`for x in list\` \`for...of\` jaisa, dict pe \`for key in d\` \`for...in\` jaisa. Python mein \`do...while\` nahi hota, \`while True\` + \`break\` se banate hain.`,
          en: `This code shows five loops: a counting \`for\` that skips ball 3 with \`continue\`; \`for...of\` summing order amounts; \`while\` with \`break\` when the OTP matches; \`for...in\` over object keys; and \`do...while\` running once even though its condition starts false.

In Python, \`range()\` covers the counting loop, \`for x in list\` matches \`for...of\`, iterating a dict gives keys, and \`do...while\` is emulated with \`while True\` and \`break\`.`,
        },
        codeJs: `const balls = [];
for (let ball = 1; ball <= 6; ball++) {
  if (ball === 3) continue; // wide ball, skip
  balls.push(ball);
}
console.log("balls:", balls.join(","));

let total = 0;
for (const amount of [120, 80, 300]) {
  total += amount;
}
console.log("total:", total);

const tries = ["1111", "2468", "9999"];
let attempt = 0;
while (attempt < tries.length) {
  if (tries[attempt] === "2468") break;
  attempt++;
}
console.log("OTP matched at attempt", attempt + 1);

const runs = { rohit: 45, virat: 82 };
for (const player in runs) {
  console.log(player, "->", runs[player]);
}

let n = 10;
do {
  console.log("do-while ran once, n =", n);
} while (n < 5);`,
        codePython: `balls = []
for ball in range(1, 7):
    if ball == 3:
        continue  # wide ball, skip
    balls.append(ball)
print("balls:", ",".join(str(b) for b in balls))

total = 0
for amount in [120, 80, 300]:
    total += amount
print("total:", total)

tries = ["1111", "2468", "9999"]
attempt = 0
while attempt < len(tries):
    if tries[attempt] == "2468":
        break
    attempt += 1
print("OTP matched at attempt", attempt + 1)

runs = {"rohit": 45, "virat": 82}
for player in runs:
    print(player, "->", runs[player])

n = 10
while True:
    print("do-while ran once, n =", n)
    if not n < 5:
        break`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `- **Off-by-one**: \`for (let i = 0; i <= arr.length; i++)\` — last round mein \`arr[arr.length]\` \`undefined\` deta hai. Sahi: \`i < arr.length\`.
- **Infinite loop**: \`while (i < 10) { ... }\` mein \`i++\` bhool gaye. Browser tab hang ho jaata hai.
- **Arrays pe \`for...in\`**: keys string hoti hain (\`"0"\`), aur extra properties bhi aa sakti hain. Arrays ke liye \`for...of\`.
- **Objects pe \`for...of\`**: \`TypeError: obj is not iterable\`. Object ke liye \`for...in\` ya \`Object.entries(obj)\`.
- **Loop ke andar array modify karna**: iterate karte waqt \`splice\` se items hatana indexes ko shift kar deta hai aur items skip ho jaate hain. Naya array banao (\`filter\`).
- **\`var\` loop variable**: callbacks mein sab last value dekhte hain. \`let\` use karo.
- **Bahut kaam loop ke andar**: har iteration mein same cheez recalculate karna (jaise \`arr.length\` nahi, balki heavy function call). Loop ke bahar nikaalo.`,
          en: `- **Off-by-one**: \`i <= arr.length\` reads past the end; use \`<\`.
- **Infinite loop**: forgetting \`i++\` in a \`while\` hangs the tab.
- **\`for...in\` on arrays** gives string keys and possibly extra properties; use \`for...of\`.
- **\`for...of\` on plain objects** throws "not iterable"; use \`Object.entries\`.
- **Mutating an array while looping** (\`splice\`) skips items; build a new array instead.
- **\`var\` loop counters** break callbacks; use \`let\`.
- **Heavy work repeated inside the loop**; hoist it out.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Loop bugs pakadne ke tareeke:

1. **Har iteration log karo**: \`console.log({ i, value: arr[i] })\`. Pehli aur aakhri iteration pe dhyan do, off-by-one wahin hota hai.
2. **Chhote input pe test karo**: 0 items, 1 item, 2 items. Zyada tar loop bugs edge cases pe dikhte hain.
3. **Infinite loop ka shaq?** Ek safety counter lagao: \`if (++guard > 1000) throw new Error("loop stuck");\`. Browser hang ho gaya toh DevTools mein "Pause script execution" button dabao, woh line dikha dega jahan atka hai.
4. **DevTools breakpoint** loop ke andar lagao aur "Step over" se har round dekho; Watch panel mein \`i\` aur condition add karo.
5. **\`undefined\` aa raha hai?** Matlab aap array ke bahar ka index padh rahe ho, ya galat loop type (for...in vs for...of) use kiya hai.
6. Python mein bhi same: \`print(i, item)\` aur chhote inputs se check karo.`,
          en: `To debug loops:

1. Log each iteration with context: \`console.log({ i, value: arr[i] })\`, especially the first and last rounds.
2. Test with 0, 1 and 2 items; edge cases reveal most bugs.
3. Suspect an infinite loop? Add a guard counter that throws after 1000 rounds, or use DevTools' "Pause script execution".
4. Put a breakpoint inside the loop and step through, watching \`i\` and the condition.
5. Seeing \`undefined\`? You are reading past the end or using the wrong loop type.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Classic \`for\` vs \`for...of\`**: index chahiye, reverse chalana hai, ya 2-2 step jump karna hai → classic \`for\`. Sirf values chahiye → \`for...of\` (kam bugs, off-by-one ka chance nahi).
- **Loop vs array methods**: \`map/filter/reduce\` declarative hain aur naya array return karte hain, padhne mein saaf. Lekin \`break\` nahi kar sakte; early exit chahiye toh \`for...of\` + \`break\` ya \`find/some\`.
- **\`forEach\`**: simple side effects ke liye theek, lekin \`await\` ke saath kaam nahi karta aur \`break\` nahi hota.
- **Performance**: 99% cases mein farak negligible hai. Bahut bade data (lakhon items) pe plain \`for\` thoda fast ho sakta hai, lekin pehle readable code likho, measure karo, tab optimize karo.
- **Recursion vs loop**: tree jaisi nested structure ke liye recursion natural hai; flat list ke liye loop simple aur stack-safe hai.`,
          en: `- **Classic \`for\` vs \`for...of\`**: need the index, reverse order or custom steps? Use \`for\`. Only values? \`for...of\` avoids off-by-one errors.
- **Loops vs array methods**: \`map/filter/reduce\` are declarative but cannot \`break\`; use \`for...of\` or \`find/some\` for early exit.
- **\`forEach\`** does not work with \`await\` and cannot break.
- **Performance** differences rarely matter; write readable code, then measure.
- **Recursion** suits nested trees; loops suit flat lists and are stack-safe.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real Node.js backend mein ek common pattern: database se saare orders ek saath load karna memory phod dega, toh **batch mein loop** chalate hain:

\`\`\`js
let page = 0;
while (true) {
  const batch = await db.orders.findMany({ skip: page * 500, take: 500 });
  if (batch.length === 0) break;
  for (const order of batch) {
    await sendInvoice(order);
  }
  page++;
}
\`\`\`

\`while (true)\` + \`break\` jab data khatam ho, aur andar \`for...of\` kyunki \`await\` ke saath sahi kaam karta hai (\`forEach\` nahi karta).

Frontend pe loops zyada tar \`map\` ke roop mein dikhte hain (list rendering). Code review mein reviewer dekhte hain: off-by-one, loop ke andar database call (N+1 problem), aur loop ke andar array mutate karna.`,
          en: `A common Node.js backend pattern loads data in **batches** instead of all at once: \`while (true)\` fetches 500 orders per page, breaks when a batch is empty, and uses \`for...of\` inside because it works correctly with \`await\` (unlike \`forEach\`).

On the frontend, loops mostly appear as \`map\` for rendering lists. Reviewers look for off-by-one errors, database calls inside loops (the N+1 problem), and mutating arrays while iterating.`,
        },
      },
    ],
    visualization: {
      kind: "CODE_EXECUTION",
      title: "for loop step by step (with continue)",
      steps: [
        { title: "Init", description: "let i = 0 sirf ek baar chalta hai. sum = 0.", highlight: "let i = 0" },
        { title: "Check i < 4", description: "0 < 4 true, body chalegi. sum = 0 + 0 = 0. Phir i++ se i = 1.", highlight: "i < 4" },
        { title: "i = 1 aur i = 2", description: "Dono baar condition true. i = 2 pe 'if (i === 2) continue' — body ka baaki hissa skip, seedha i++ pe.", highlight: "continue" },
        { title: "i = 3", description: "3 < 4 true, sum mein 3 juda. sum = 0 + 1 + 3 = 4. i++ se i = 4.", highlight: "sum += i" },
        { title: "Exit", description: "4 < 4 false hai, loop khatam. Final sum = 4. Agar condition <= hoti toh ek extra round chalta (off-by-one).", highlight: "i < 4 → false" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which loop is best for reading every value of an array, when you do not need the index?",
        options: ["for...in", "for...of", "do...while", "switch"],
        correct: [1],
        explanation: "`for...of` seedha values deta hai aur off-by-one ka risk nahi. `for...in` keys (string indexes) deta hai, jo arrays ke liye galat choice hai.",
        tags: ["for-of"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `continue` do inside a loop?",
        options: [
          "Stops the loop completely",
          "Skips the rest of the current iteration and moves to the next one",
          "Restarts the loop from the first iteration",
          "Pauses the loop for one second",
        ],
        correct: [1],
        explanation: "`continue` = \"yeh round chhodo, agla shuru karo\" (jaise wide ball). Poora loop rokna `break` ka kaam hai.",
        tags: ["continue"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Which loop always runs its body at least once?",
        options: ["for", "while", "do...while", "for...of"],
        correct: [2],
        explanation: "`do...while` pehle body chalata hai, phir condition check karta hai. Baaki sab pehle condition check karte hain, toh zero baar bhi chal sakte hain.",
        tags: ["do-while"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these can cause an infinite loop? (Select all that apply)",
        options: [
          "while (i < 10) { console.log(i); } with no change to i",
          "for (let i = 0; i < 10; i--) { }",
          "for (const x of [1, 2, 3]) { }",
          "while (true) { } with no break",
        ],
        correct: [0, 1, 3],
        explanation: "Infinite loop tab hota hai jab condition kabhi false nahi hoti: i badla hi nahi, i ulti direction mein ja raha hai, ya `while(true)` bina break. `for...of` array khatam hote hi ruk jaata hai.",
        tags: ["infinite-loop"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `let s = "";
for (let i = 0; i < 5; i++) {
  if (i === 3) continue;
  s += i;
}
console.log(s);`,
        codeLanguage: "javascript",
        options: ["01234", "0124", "012", "1245"],
        correct: [1],
        explanation: "i = 0,1,2 jud jaate hain. i = 3 pe `continue` us round ko skip karta hai. i = 4 judta hai. i = 5 pe condition false. Result \"0124\". Number string mein `+=` se judta hai, add nahi hota kyunki s string hai.",
        tags: ["continue"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `const runs = [4, 6, 1];
for (const x in runs) {
  console.log(x, typeof x);
}`,
        codeLanguage: "javascript",
        options: ["4 number\n6 number\n1 number", "0 string\n1 string\n2 string", "0 number\n1 number\n2 number", "TypeError"],
        correct: [1],
        explanation: "`for...in` keys deta hai, values nahi. Array ki keys indexes hain aur woh **strings** hoti hain: \"0\", \"1\", \"2\". Values chahiye thi toh `for...of` likhna tha.",
        tags: ["for-in"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "You must find the first order above ₹1000 in a list of 50,000 orders and stop as soon as it is found. What is the best approach?",
        options: [
          "orders.forEach with a return inside",
          "A for...of loop with break, or orders.find()",
          "orders.map and then take the first element",
          "for...in over the orders array",
        ],
        correct: [1],
        explanation: "Pehla match milte hi rukna hai, toh `break` ya `find()` jo khud ruk jaata hai. `forEach` mein return sirf us callback se nikalta hai, loop chalta rehta hai. `map` poori list process karega.",
        tags: ["break"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order what happens in `for (let i = 0; i < 2; i++) { body }` from start to the first time the update runs.",
        options: [
          "Run the initialiser let i = 0 once",
          "Check the condition i < 2",
          "Run the body",
          "Run the update i++",
          "Check the condition again",
        ],
        explanation: "Init sirf ek baar, phir har round: condition → body → update → wapas condition. Condition false hote hi loop khatam.",
        tags: ["for"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain what an off-by-one error is in a loop, with an example of how `<=` can cause it.",
        keywords: ["extra iteration", "length", "undefined", "last index", "<"],
        explanation: "Off-by-one matlab loop ek baar zyada ya kam chalna. Array ka last index `length - 1` hai, toh `i <= arr.length` ek extra iteration chalayega jahan `arr[i]` undefined hoga. Sahi: `i < arr.length`.",
        tags: ["off-by-one"],
      },
    ],
    buildTask: {
      title: "FizzBuzz (cricket commentary edition)",
      description: `Classic interview problem! Function \`fizzBuzz(n)\` banao jo 1 se n tak ki ek **array of strings** return kare:

- Agar number 3 aur 5 dono se divide hota hai → \`"FizzBuzz"\`
- Sirf 3 se → \`"Fizz"\`
- Sirf 5 se → \`"Buzz"\`
- Warna number khud, **string** ke roop mein (jaise \`"7"\`)

Example: \`fizzBuzz(5)\` → \`["1", "2", "Fizz", "4", "Buzz"]\`. Agar n 0 ya negative hai toh khaali array.`,
      functionName: "fizzBuzz",
      starterJs: `function fizzBuzz(n) {
  const result = [];
  // loop from 1 to n
  return result;
}`,
      starterPython: `def fizzBuzz(n):
    result = []
    # loop from 1 to n
    return result`,
      tests: [
        { name: "first five", args: [5], expected: ["1", "2", "Fizz", "4", "Buzz"] },
        { name: "up to 15", args: [15], expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"] },
        { name: "just one", args: [1], expected: ["1"] },
        { name: "zero", args: [0], expected: [] },
        { name: "negative", args: [-3], expected: [], hidden: true },
        { name: "three", args: [3], expected: ["1", "2", "Fizz"], hidden: true },
      ],
      hints: [
        "% (modulo) remainder deta hai. i % 3 === 0 matlab i, 3 se divide hota hai. 15 wala case sabse pehle check karo.",
        "for (let i = 1; i <= n; i++) chalao. Har i ke liye if / else if se string choose karo aur result mein push karo.",
        "if (i % 15 === 0) result.push('FizzBuzz'); else if (i % 3 === 0) result.push('Fizz'); ... else result.push(String(i));",
      ],
      explainQuestions: [
        { question: "Why must the FizzBuzz (divisible by 15) check come first?", keywords: ["first match", "else if", "3 and 5", "order"] },
        { question: "Why does your loop use <= n instead of < n?", keywords: ["include n", "1 to n", "off-by-one"] },
        { question: "What happens when n is 0 and why?", keywords: ["condition false", "never runs", "empty array"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "What is the difference between for...in and for...of?",
        short: "for...of iterates over the values of an iterable such as an array, string, Map or Set using the iterator protocol. for...in iterates over the enumerable string keys of an object, including inherited ones. So for arrays we use for...of, and for plain objects we use for...in or Object.entries.",
        deep: `- \`for...of\` calls \`obj[Symbol.iterator]()\`; plain objects are not iterable, so it throws.
- \`for...in\` gives keys as strings and can include properties from the prototype chain; guard with \`Object.hasOwn\`.
- On arrays, \`for...in\` returns "0", "1"... and any custom properties added to the array.
- \`Object.entries(obj)\` + \`for...of\` with destructuring is the modern way: \`for (const [k, v] of Object.entries(obj))\`.`,
        followUps: ["How would you iterate an object's keys and values together?", "What makes an object iterable?"],
        commonMistake: "Using for...in on arrays and then doing arithmetic with the string index.",
        keywords: ["iterable", "values", "keys", "iterator protocol", "prototype"],
        difficulty: 1,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
      {
        question: "Why doesn't break work inside forEach, and what would you use instead?",
        short: "forEach calls a callback for each element; break is only valid inside a loop statement, and return just exits the current callback. To stop early, use a for...of loop with break, or methods built for early exit like find, some or every.",
        deep: `- \`break\` inside the callback is a SyntaxError; \`return\` only skips that one element.
- \`some(cb)\` stops when cb returns true; \`every(cb)\` stops when cb returns false; \`find\` returns the first match.
- Throwing an exception to exit forEach works but is an anti-pattern.
- forEach also ignores returned promises, so \`await\` inside it does not pause the loop.`,
        followUps: ["Why does await inside forEach not run sequentially?", "What is the difference between some and every?"],
        commonMistake: "Believing return inside forEach stops the whole loop.",
        keywords: ["callback", "for...of", "some", "find", "early exit"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "SDE"],
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────────
  // 4. Functions
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "js-functions",
    estMinutes: 45,
    difficulty: 1,
    prerequisites: ["js-loops"],
    objectives: [
      "Function declaration, function expression aur arrow function likhna",
      "Parameters, default values aur return ka sahi use karna",
      "Functions ko values ki tarah pass karna (callbacks, first-class functions)",
      "Pure functions aur side effects mein farak samajhna",
    ],
    technicalDefinition:
      "A function is a reusable, callable block of code that receives inputs through parameters and produces a value via return; in JavaScript functions are first-class objects that can be stored in variables, passed as arguments and returned from other functions.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Function** ek chhoti machine hai: input do (parameters), andar kuch kaam hota hai, aur output milta hai (\`return\`). Ek baar likho, jitni baar chahe call karo.

JavaScript mein function likhne ke 3 common tareeke:
- **Declaration**: \`function add(a, b) { return a + b; }\`
- **Expression**: \`const add = function (a, b) { return a + b; };\`
- **Arrow**: \`const add = (a, b) => a + b;\`

JS mein functions **first-class** hain: unhe variable mein rakh sakte ho, doosre function ko argument mein de sakte ho (callback), aur function se function return bhi kar sakte ho. Agar \`return\` nahi likha, toh function \`undefined\` return karta hai.`,
          en: `A **function** is a small machine: give it inputs (parameters), it does some work, and gives back an output with \`return\`. Write once, call many times.

Three common forms:
- **Declaration**: \`function add(a, b) { return a + b; }\`
- **Expression**: \`const add = function (a, b) { ... };\`
- **Arrow**: \`const add = (a, b) => a + b;\`

Functions are **first-class**: you can store them in variables, pass them as arguments (callbacks) and return them. Without \`return\`, a function returns \`undefined\`.`,
          hi: `**फ़ंक्शन** एक छोटी मशीन है: इनपुट दीजिए (parameters), अंदर कुछ काम होता है, और आउटपुट मिलता है (\`return\`)। एक बार लिखिए, जितनी बार चाहें बुलाइए।

JavaScript में फ़ंक्शन लिखने के तीन आम तरीके हैं: declaration (\`function add(a, b)\`), expression (\`const add = function ...\`) और arrow (\`const add = (a, b) => a + b\`)।

JavaScript में फ़ंक्शन **first-class** होते हैं: इन्हें वेरिएबल में रख सकते हैं, दूसरे फ़ंक्शन को argument के रूप में दे सकते हैं, और फ़ंक्शन से लौटा भी सकते हैं। अगर \`return\` नहीं लिखा तो फ़ंक्शन \`undefined\` लौटाता है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Chai wale bhaiya ki recipe** socho. Recipe ek baar dimaag mein fit hai:

\`banaoChai(doodh, cheeni, adrak)\`

- **Parameters** = order ke details: "kam cheeni, extra adrak".
- **Function body** = recipe ke steps: paani ubaalo, patti daalo, doodh, cheeni...
- **Return** = haath mein garam chai ka cup.
- **Default parameter** = agar tumne cheeni nahi batayi, toh bhaiya default 2 chammach daal dete hain: \`cheeni = 2\`.

Har customer ke liye recipe dobara likhni nahi padti, bas "call" karte ho: "Bhaiya, ek chai!".

**Callback** aisa hai jaise tum bolte ho: "Chai ban jaaye toh mujhe awaaz de dena". Tumne apna "awaaz dena" wala kaam (function) bhaiya ko de diya, woh sahi time pe use call karenge.

Agar bhaiya ne chai banayi par cup diya hi nahi (\`return\` bhool gaye), toh tumhare haath mein \`undefined\` hai.`,
          en: `Think of a **tea seller's recipe**: \`makeTea(milk, sugar, ginger)\`.

- **Parameters** are the order details: less sugar, extra ginger.
- The **body** is the recipe steps.
- **Return** is the cup of tea handed to you.
- A **default parameter** is "no sugar preference given, so 2 spoons".

You do not rewrite the recipe per customer; you just call it. A **callback** is saying "call me when the tea is ready": you hand over your own function to be called later. If the seller makes tea but never hands the cup over (no \`return\`), you get \`undefined\`.`,
          hi: `**चाय वाले भैया की रेसिपी** सोचिए: \`banaoChai(doodh, cheeni, adrak)\`।

- **Parameters** ऑर्डर की जानकारी हैं: कम चीनी, ज़्यादा अदरक।
- **फ़ंक्शन बॉडी** रेसिपी के स्टेप हैं।
- **Return** आपके हाथ में आया चाय का कप है।
- **Default parameter**: अगर आपने चीनी नहीं बताई तो भैया 2 चम्मच डाल देते हैं।

हर ग्राहक के लिए रेसिपी दोबारा नहीं लिखनी पड़ती, बस बुलाना होता है। **Callback** ऐसा है जैसे आप कहें "चाय बन जाए तो मुझे आवाज़ दे देना"। और अगर भैया ने चाय बनाई पर कप दिया ही नहीं, तो आपके हाथ में \`undefined\` है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Bina functions ke, har jagah same logic copy-paste hota. Socho Swiggy app mein GST calculate karne ka code 15 jagah likha hai, aur government GST rate badal de. Ab 15 jagah change karo aur pray karo ki koi jagah chhooti nahi.

Functions yeh problems solve karte hain:
- **DRY (Don't Repeat Yourself)**: logic ek jagah, change ek jagah.
- **Naam se samajh**: \`calculateDeliveryFee(order)\` padh ke hi pata chal jaata hai kya ho raha hai, andar ke 20 lines padhne ki zaroorat nahi.
- **Testing**: ek chhota function alag se test kar sakte ho: input do, output check karo.
- **Composition**: chhote functions jod ke bada kaam: \`formatPrice(applyDiscount(price, 10))\`.
- **Callbacks**: "jab button click ho tab yeh chalana", "jab data aaye tab yeh" — JS ka poora event aur async system functions pass karne pe hi bana hai.`,
          en: `Without functions, the same logic would be copy-pasted everywhere. If GST calculation lived in 15 places and the rate changed, you would edit 15 places and hope you found them all.

Functions give:
- **DRY**: logic in one place.
- **Readable names**: \`calculateDeliveryFee(order)\` explains itself.
- **Testability**: give input, check output.
- **Composition**: \`formatPrice(applyDiscount(price, 10))\`.
- **Callbacks**: JavaScript's whole event and async model is built on passing functions around.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Razorpay / Stripe SDK**: payment ke baad kya karna hai, woh tum ek **callback function** dete ho: \`handler: function (response) { ... }\`. Payment complete hote hi Razorpay tumhara function call karta hai.
- **React (Instagram web, Netflix UI)**: har component ek function hi hai: \`function ProfileCard(props) { return ... }\`. Button pe \`onClick={() => likePost(id)}\` arrow function pass hota hai.
- **Express backend (Node.js)**: har route handler ek function hai: \`app.get("/orders", (req, res) => { ... })\`. Middleware bhi functions ki chain hai.
- **Utility libraries (lodash, date-fns)**: chhote pure functions jaise \`format(date, "dd/MM/yyyy")\` jo har Indian startup ke codebase mein dikhte hain.

Matlab JavaScript mein function sirf "code reuse" nahi, poore framework ka building block hai.`,
          en: `- **Razorpay / Stripe SDKs**: you pass a **callback** such as \`handler(response)\` that runs after payment.
- **React (Instagram web, Netflix UI)**: every component is a function, and event handlers are arrow functions like \`onClick={() => likePost(id)}\`.
- **Express**: each route handler and middleware is a function: \`app.get("/orders", (req, res) => ...)\`.
- **Utility libraries** like date-fns are collections of small pure functions.

In JavaScript, functions are the building block of entire frameworks, not just code reuse.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Jab tum function call karte ho, andar yeh hota hai:

1. Engine ek naya **execution context** banata hai aur use **call stack** pe push karta hai.
2. Is context mein parameters local variables ban jaate hain. Argument nahi diya toh value \`undefined\`, ya default parameter lag jaata hai.
3. Body line by line chalti hai. Andar koi aur function call hua toh uska context stack ke upar push hota hai.
4. \`return\` milte hi value caller ko wapas jaati hai aur context stack se **pop** ho jaata hai. Local variables (agar kisi closure ne pakde nahi) garbage collect ho jaate hain.

**Hoisting**: function declaration poora hoist hota hai, toh definition se pehle call kar sakte ho. Function expression/arrow \`const\` mein hai, toh pehle call karne pe TDZ error.

**Arrow function** ka apna \`this\` aur \`arguments\` nahi hota, woh bahar wale scope se leta hai. Isliye object methods ke liye arrow avoid karte hain, callbacks ke liye prefer karte hain.`,
          en: `When you call a function:

1. The engine creates an **execution context** and pushes it onto the **call stack**.
2. Parameters become local variables; missing arguments are \`undefined\` unless a default applies.
3. The body runs; nested calls push new contexts on top.
4. On \`return\` the value goes back to the caller and the context is **popped**.

Function **declarations** are fully hoisted and callable before their line; expressions and arrows assigned to \`const\` are in the TDZ. Arrow functions have no own \`this\` or \`arguments\`, so they suit callbacks more than object methods.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Code mein functions ke saare important forms hain:

- \`addGst\`: function **declaration**, default parameter \`rate = 18\`. Hoisting ki wajah se upar wali line mein bhi call ho sakta tha.
- \`roundRupees\`: **arrow** function, ek line, implicit return (\`{}\` nahi hai toh return automatic).
- \`applyToAll(prices, fn)\`: function ko **argument** mein liya (callback). Yeh first-class functions ka example hai.
- \`makeMultiplier(n)\`: function **return** karta hai doosra function.
- \`noReturn\`: return nahi likha, toh \`undefined\`.

Python mein \`def\` declaration hai, \`lambda\` chhote arrow jaisa, aur functions wahan bhi first-class hain. Default params \`rate=18\` same tarah kaam karte hain.`,
          en: `The code shows the main forms: \`addGst\` is a declaration with a default parameter; \`roundRupees\` is a one-line arrow with implicit return; \`applyToAll\` takes a function as an argument (callback); \`makeMultiplier\` returns a function; \`noReturn\` shows that a missing return gives \`undefined\`.

In Python, \`def\` is the declaration, \`lambda\` is like a short arrow, functions are first-class too, and default parameters work the same way.`,
        },
        codeJs: `function addGst(amount, rate = 18) {
  return amount + (amount * rate) / 100;
}

const roundRupees = (x) => Math.round(x);

function applyToAll(prices, fn) {
  const out = [];
  for (const p of prices) out.push(fn(p));
  return out;
}

function makeMultiplier(n) {
  return (x) => x * n;
}

function noReturn() {
  const temp = 5;
}

console.log(addGst(100), addGst(100, 5));
console.log(roundRupees(addGst(99)));
console.log(applyToAll([100, 200], addGst));
const triple = makeMultiplier(3);
console.log(triple(7));
console.log(noReturn());`,
        codePython: `def add_gst(amount, rate=18):
    return amount + (amount * rate) / 100

round_rupees = lambda x: round(x)

def apply_to_all(prices, fn):
    out = []
    for p in prices:
        out.append(fn(p))
    return out

def make_multiplier(n):
    return lambda x: x * n

def no_return():
    temp = 5

print(add_gst(100), add_gst(100, 5))
print(round_rupees(add_gst(99)))
print(apply_to_all([100, 200], add_gst))
triple = make_multiplier(3)
print(triple(7))
print(no_return())`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `- **\`return\` bhool jaana**: function sab calculate karta hai par output nahi deta, result \`undefined\`.
- **Arrow function mein \`{}\` + implicit return confusion**: \`const double = n => { n * 2 }\` \`undefined\` deta hai, kyunki curly braces ke saath \`return\` likhna padta hai. Ya \`n => n * 2\`.
- **Object return karte waqt brackets**: \`() => { name: "Riya" }\` object nahi, block hai! Sahi: \`() => ({ name: "Riya" })\`.
- **Function call vs reference**: \`button.onclick = handleClick()\` turant call kar deta hai aur uska result assign hota hai. Sahi: \`button.onclick = handleClick\`.
- **Bahut saare kaam ek function mein**: 200 line ka function jo validate bhi kare, DB mein save bhi kare, email bhi bheje. Ek function = ek kaam.
- **Arguments ka order galat**: \`applyDiscount(10, 1000)\` jab signature \`(price, pct)\` hai. Zyada params ho toh ek object pass karo: \`createOrder({ userId, items, coupon })\`.
- **Parameters ko mutate karna**: argument mein aaya object badal dena caller ke data ko bhi badal deta hai.`,
          en: `- Forgetting \`return\`, so the result is \`undefined\`.
- \`n => { n * 2 }\` returns \`undefined\`; braces need an explicit \`return\`.
- \`() => { name: "Riya" }\` is a block, not an object; wrap it: \`() => ({ name: "Riya" })\`.
- \`onclick = handleClick()\` calls immediately; pass \`handleClick\` instead.
- Giant functions doing validation, saving and emailing; one function, one job.
- Wrong argument order; use an options object for many parameters.
- Mutating object parameters, which changes the caller's data.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Function galat result de raha hai? Step by step:

1. **Input aur output log karo**: function ke start mein \`console.log("applyDiscount in:", price, pct)\` aur return se pehle output. Pata chalega galti input mein hai ya logic mein.
2. **\`undefined\` aaya?** Check karo: return likha hai? Arrow mein braces ke saath return hai? Saare code paths (if/else ki har branch) return kar rahe hain?
3. **\`TypeError: x is not a function\`**: jis cheez ko call kar rahe ho woh function nahi hai. Spelling, import, ya kisi ne variable overwrite kar diya. \`console.log(typeof x)\` karo.
4. **Call stack dekho**: DevTools mein breakpoint lagao, "Call Stack" panel batayega yeh function kisne, kahan se call kiya. Error ka stack trace bhi yahi batata hai: upar wali line = jahan error aaya.
5. **"Step into" (F11)** se function ke andar jao, "Step out" se bahar.
6. **Isolate karo**: function ko alag se chhote input ke saath call karo. Pure function hai toh result predictable hona chahiye.`,
          en: `When a function returns the wrong result:

1. Log inputs at the start and the value before returning.
2. Getting \`undefined\`? Check every code path returns, and arrow braces.
3. \`x is not a function\`: check spelling, imports, or overwritten variables with \`typeof x\`.
4. Use the Call Stack panel or the error stack trace to see who called it.
5. Step into (F11) and step out of functions in DevTools.
6. Call the function alone with a tiny input; pure functions are predictable.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Declaration vs arrow**: top-level, naam wale functions ke liye declaration (hoisting + stack trace mein saaf naam). Callbacks aur chhote helpers ke liye arrow (chhota syntax, bahar ka \`this\`).
- **Arrow kab nahi**: object methods jahan \`this\` chahiye (\`const user = { name, greet: () => this.name }\` galat hai), aur constructors (arrow ko \`new\` nahi kar sakte).
- **Pure vs impure**: pure function (same input → same output, koi side effect nahi) test karna aasaan hai. Lekin real app ko DB write, API call, logging chahiye hi. Pattern: logic pure rakho, side effects kinaron pe.
- **Bahut chhote functions**: har line ka function bana diya toh code mein idhar-udhar kood ke padhna padta hai. Function tab banao jab naam se clarity aaye ya reuse ho.
- **Positional params vs options object**: 3 se zyada params ho toh object lo: order yaad nahi rakhna padta aur optional fields aasaan.`,
          en: `- **Declaration vs arrow**: declarations for named top-level functions (hoisting, clear stack traces); arrows for callbacks.
- **Avoid arrows** for methods needing \`this\` and for constructors.
- **Pure vs impure**: pure functions are easy to test, but apps need side effects; keep logic pure and push side effects to the edges.
- **Over-splitting** into tiny functions hurts readability.
- **Options object** beats positional parameters beyond three arguments.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real project (maan lo ek food delivery backend) mein billing logic aise chhote, pure functions mein toota hota hai:

\`\`\`js
// billing.js
export const itemsTotal = (items) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0);
export const applyDiscount = (amount, pct) =>
  amount - Math.floor((amount * pct) / 100);
export const addGst = (amount, rate = 5) =>
  amount + Math.round((amount * rate) / 100);

export function finalBill(order) {
  return addGst(applyDiscount(itemsTotal(order.items), order.discountPct ?? 0));
}
\`\`\`

Har function ka apna unit test hai (Jest/Vitest): \`expect(applyDiscount(1000, 10)).toBe(900)\`. Route handler (\`app.post("/checkout", ...)\`) sirf request padhta hai, \`finalBill\` call karta hai, aur response bhejta hai. Logic aur HTTP alag rehte hain, isliye bug dhoondhna aur change karna aasaan.`,
          en: `In a food-delivery backend, billing is split into small pure functions such as \`itemsTotal\`, \`applyDiscount\` and \`addGst\`, composed by \`finalBill(order)\`.

Each has its own unit test, e.g. \`expect(applyDiscount(1000, 10)).toBe(900)\`. The route handler only reads the request, calls \`finalBill\` and sends the response, so business logic stays separate from HTTP and is easy to change and debug. When the GST rate changes, only one small function and its test need updating.`,
        },
      },
    ],
    visualization: {
      kind: "STACK",
      title: "Call stack: finalBill(order) chalta hua",
      steps: [
        { title: "Global context", description: "Script shuru hui, stack mein sirf global context hai.", highlight: "global" },
        { title: "finalBill push", description: "finalBill(order) call hua. Naya execution context stack pe push hua, order local variable bana.", highlight: "finalBill" },
        { title: "itemsTotal push", description: "finalBill ke andar sabse andar wala call pehle chalta hai: itemsTotal(items). Yeh stack ke top pe hai.", highlight: "itemsTotal" },
        { title: "itemsTotal pop, applyDiscount push", description: "itemsTotal ne 1000 return kiya aur pop ho gaya. Ab applyDiscount(1000, 10) push hua, 900 return karke pop.", highlight: "applyDiscount" },
        { title: "addGst push/pop", description: "addGst(900) push hua, 945 return kiya, pop. Stack wapas finalBill pe.", highlight: "addGst" },
        { title: "finalBill pop", description: "finalBill ne 945 return kiya aur pop hua. Stack mein phir se sirf global.", highlight: "return 945" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does a JavaScript function return if it has no return statement?",
        options: ["null", "0", "undefined", "An error is thrown"],
        correct: [2],
        explanation: "Return nahi likha toh function automatically `undefined` deta hai. Error nahi aata, isliye yeh bug chupke se aage badh jaata hai.",
        tags: ["return"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Which function can be called on a line BEFORE it is defined in the file?",
        options: [
          "function greet() {}",
          "const greet = function () {};",
          "const greet = () => {};",
          "let greet = () => {};",
        ],
        correct: [0],
        explanation: "Function **declaration** poora hoist hota hai. Baaki teeno const/let variable mein rakhe hain, jo TDZ mein hote hain, toh pehle call karne pe ReferenceError aayega.",
        tags: ["hoisting"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Which arrow function correctly returns an object `{ ok: true }`?",
        options: ["() => { ok: true }", "() => ({ ok: true })", "() => [ok: true]", "() => return { ok: true }"],
        correct: [1],
        explanation: "Arrow ke baad `{` ko JS function body samajhti hai, object nahi. Object return karna ho toh round brackets mein lapeto: `() => ({ ok: true })`.",
        tags: ["arrow"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which statements show that functions are 'first-class' in JavaScript? (Select all that apply)",
        options: [
          "A function can be stored in a variable",
          "A function can be passed as an argument to another function",
          "A function can be returned from another function",
          "A function must always have a name",
        ],
        correct: [0, 1, 2],
        explanation: "First-class matlab function bhi ek normal value hai: variable mein rakho, argument mein do, return karo. Naam zaroori nahi, anonymous functions bhi hote hain.",
        tags: ["first-class"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `function add(a, b = 10) {
  return a + b;
}
console.log(add(5));
console.log(add(5, 1));
console.log(add(5, undefined));`,
        codeLanguage: "javascript",
        options: ["15\n6\n15", "15\n6\nNaN", "NaN\n6\nNaN", "5\n6\n5"],
        correct: [0],
        explanation: "Default parameter tab lagta hai jab argument missing ho **ya** `undefined` pass kiya ho. Toh add(5) aur add(5, undefined) dono mein b = 10, result 15. add(5, 1) = 6.",
        tags: ["default-params"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `const double = (n) => { n * 2 };
const triple = (n) => n * 3;
console.log(double(4), triple(4));`,
        codeLanguage: "javascript",
        options: ["8 12", "undefined 12", "8 undefined", "SyntaxError"],
        correct: [1],
        explanation: "`double` mein curly braces hain, toh yeh block body hai aur `return` likhna zaroori tha; result `undefined`. `triple` mein braces nahi, toh implicit return: 12.",
        tags: ["arrow", "return"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "A teammate wrote `button.addEventListener(\"click\", sendOtp());` and the OTP is sent as soon as the page loads, not on click. Why?",
        options: [
          "addEventListener only works with arrow functions",
          "sendOtp() is called immediately and its return value is passed as the listener",
          "The event name should be 'onclick'",
          "sendOtp must be declared with const",
        ],
        correct: [1],
        explanation: "`sendOtp()` brackets ke saath likha toh function **abhi** call ho gaya aur uska result (shayad undefined) listener ban gaya. Function ka reference dena tha: `addEventListener(\"click\", sendOtp)`.",
        tags: ["callbacks"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order what happens when `const total = addGst(100);` runs.",
        options: [
          "A new execution context for addGst is pushed on the call stack",
          "Parameter amount is set to 100 and rate falls back to its default",
          "The function body runs and computes the result",
          "return sends the value back and the context is popped",
          "The returned value is stored in total",
        ],
        explanation: "Call → stack pe naya context → parameters set (default bhi) → body → return value wapas + pop → caller us value ko variable mein rakhta hai.",
        tags: ["call-stack"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "What is a pure function, and why are pure functions easier to test?",
        keywords: ["same input", "same output", "no side effects", "predictable", "external state"],
        explanation: "Pure function same input pe hamesha same output deta hai aur bahar ki koi cheez nahi badalta (no side effects: DB, global variable, network). Isliye test mein bas input do aur output compare karo, koi setup ya mock nahi chahiye.",
        tags: ["pure-functions"],
      },
    ],
    buildTask: {
      title: "Discount calculator",
      description: `Flipkart sale chal rahi hai! Function \`applyDiscount(price, pct)\` banao jo final price return kare.

Rules:
- \`price\` ek integer hai (rupees mein).
- \`pct\` discount percentage hai. Agar 0 se kam hai toh 0 maano, 100 se zyada hai toh 100 maano (clamp).
- Discount amount = \`floor(price * pct / 100)\` (paisa round down).
- Return: \`price - discount\` (integer).

Example: \`applyDiscount(999, 15)\` → discount = floor(149.85) = 149 → \`850\`.`,
      functionName: "applyDiscount",
      starterJs: `function applyDiscount(price, pct) {
  // clamp pct, compute discount, return final price
  return price;
}`,
      starterPython: `def applyDiscount(price, pct):
    # clamp pct, compute discount, return final price
    return price`,
      tests: [
        { name: "10 percent", args: [1000, 10], expected: 900 },
        { name: "no discount", args: [499, 0], expected: 499 },
        { name: "floor the discount", args: [999, 15], expected: 850 },
        { name: "full discount", args: [1000, 100], expected: 0 },
        { name: "pct above 100 is clamped", args: [200, 150], expected: 0, hidden: true },
        { name: "negative pct is clamped", args: [80, -5], expected: 80, hidden: true },
      ],
      hints: [
        "Clamp matlab value ko ek range mein band karna: Math.min(100, Math.max(0, pct)). Python mein min(100, max(0, pct)).",
        "Teen steps: (1) pct clamp karo, (2) discount = Math.floor(price * pct / 100), (3) price - discount return karo.",
        "const p = Math.min(100, Math.max(0, pct)); const discount = Math.floor((price * p) / 100); return price - discount;",
      ],
      explainQuestions: [
        { question: "Why did you clamp the percentage before using it?", keywords: ["invalid input", "range", "0 to 100", "negative"] },
        { question: "Why use floor for the discount?", keywords: ["round down", "integer", "paise"] },
        { question: "Is your function pure? Why does that matter?", keywords: ["same input", "same output", "no side effects", "test"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "What is the difference between a function declaration and an arrow function?",
        short: "Function declarations are hoisted completely, have their own this, arguments object and can be used as constructors. Arrow functions are expressions, so they are not callable before definition, and they do not have their own this or arguments; they capture this lexically from the surrounding scope. That makes arrows great for callbacks but wrong for object methods that rely on this.",
        deep: `- **Hoisting**: declarations are fully hoisted; arrows follow const/let rules (TDZ).
- **\`this\`**: declarations get a dynamic \`this\` set by the call site; arrows capture \`this\` lexically from the enclosing scope.
- **\`arguments\`**: declarations have it; arrows do not (use rest params).
- **\`new\`**: allowed with declarations; a TypeError with arrows.
- **Syntax**: arrows are shorter and support implicit return.

Typical bug: \`setTimeout(function () { this.count++ }, 100)\` inside a class loses \`this\`; an arrow fixes it.`,
        followUps: ["Why can't you use an arrow function as a constructor?", "How does this behave inside an arrow defined in a class method?"],
        commonMistake: "Saying arrow functions are just shorter syntax with identical behaviour.",
        keywords: ["hoisting", "lexical this", "arguments", "constructor", "callback"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
      {
        question: "What does it mean that functions are first-class citizens in JavaScript?",
        short: "It means functions are values like any other: they can be assigned to variables, stored in arrays or objects, passed as arguments and returned from other functions. This enables callbacks, higher-order functions like map and filter, and closures.",
        deep: `- **Higher-order function**: takes or returns a function, e.g. \`arr.map(fn)\`, \`makeMultiplier(3)\`.
- **Callbacks**: event listeners, \`setTimeout\`, Node-style APIs.
- **Closures** arise because a returned function keeps access to its creation scope.
- Functions are objects: they can have properties (\`fn.name\`, \`fn.length\`).`,
        followUps: ["Give an example of a higher-order function you wrote.", "How do first-class functions enable closures?"],
        commonMistake: "Confusing first-class functions with higher-order functions; the first is a language property, the second a usage pattern.",
        keywords: ["value", "callback", "higher-order", "return function", "closure"],
        difficulty: 1,
        roles: ["FRONTEND", "FULLSTACK", "SDE"],
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────────
  // 5. Arrays and array methods
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "js-arrays",
    estMinutes: 50,
    difficulty: 2,
    prerequisites: ["js-loops", "js-functions"],
    objectives: [
      "Array banana, index se padhna aur push/pop/slice/splice ka use karna",
      "map, filter, reduce, find, some aur includes se data transform karna",
      "Mutating aur non-mutating methods mein farak pehchanna",
      "sort() ka default string-sorting gotcha samajh ke numeric sort likhna",
    ],
    technicalDefinition:
      "A JavaScript array is an ordered, zero-indexed, dynamically sized list object that can hold values of any type, and exposes built-in higher-order methods such as map, filter and reduce for transforming its elements.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Array** ek ordered list hai jismein multiple values ek saath rakhi jaati hain: \`const prices = [120, 80, 300];\`. Har item ka ek **index** hota hai jo **0 se shuru** hota hai: \`prices[0]\` = 120. \`prices.length\` batata hai kitne items hain.

JS arrays dynamic hain: size fix nahi, aur kisi bhi type ki value rakh sakte ho (lekin practice mein ek type hi rakhte hain).

Asli power **array methods** mein hai:
- \`map\`: har item ko badal ke naya array.
- \`filter\`: sirf woh items jo condition pass karein.
- \`reduce\`: saare items ko ek value mein combine (jaise total).
- \`find\`, \`some\`, \`includes\`: dhoondhna aur check karna.
- \`push/pop\`: end mein add/remove.`,
          en: `An **array** is an ordered list holding many values: \`const prices = [120, 80, 300];\`. Each item has a **zero-based index**: \`prices[0]\` is 120, and \`prices.length\` gives the count.

Arrays are dynamic in size and can hold any type, though in practice one type is kept.

The real power is in **array methods**: \`map\` transforms each item, \`filter\` keeps items passing a test, \`reduce\` combines items into one value, \`find\`/\`some\`/\`includes\` search and check, and \`push\`/\`pop\` add or remove at the end.`,
          hi: `**Array** एक क्रमबद्ध सूची है जिसमें कई वैल्यू एक साथ रखी जाती हैं: \`const prices = [120, 80, 300];\`। हर आइटम का एक **index** होता है जो **0 से शुरू** होता है, यानी \`prices[0]\` = 120। \`prices.length\` बताता है कि कितने आइटम हैं।

असली ताकत **array methods** में है: \`map\` हर आइटम को बदलकर नया array बनाता है, \`filter\` केवल शर्त पूरी करने वाले आइटम रखता है, \`reduce\` सबको मिलाकर एक वैल्यू बनाता है (जैसे कुल योग), और \`find\` व \`includes\` खोजने के काम आते हैं।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**IRCTC train ke coaches** socho: S1, S2, S3... ek line mein, ek fixed order mein. Har coach ka number hai (index), bas farak itna ki JS mein counting 0 se shuru hoti hai.

Ab array methods ko station pe kaam karne wale staff ki tarah dekho:

- **\`map\`** = pantry wala jo har coach mein jaake har passenger ko chai deta hai. Har passenger ke liye ek output, count same.
- **\`filter\`** = TTE jo sirf confirmed ticket wale passengers ki list banata hai. Count kam ho sakta hai.
- **\`reduce\`** = guard jo saare coaches ke passengers gin ke ek number deta hai: "Total 1,240".
- **\`find\`** = "Coach mein koi doctor hai?" Pehla mila, bas ruk gaye.
- **\`push\`** = train ke end mein naya coach jodna. **\`pop\`** = last coach hatana.

Aur **\`sort()\` ka gotcha**: default mein yeh numbers ko string ki tarah sort karta hai, jaise dictionary mein: "10" pehle aayega "9" se!`,
          en: `Think of **train coaches** S1, S2, S3 in a fixed order, each with a number (index), except JavaScript counts from 0.

Array methods are like station staff:
- **\`map\`**: the pantry worker serving tea to every passenger; one output per passenger.
- **\`filter\`**: the ticket checker listing only confirmed passengers.
- **\`reduce\`**: the guard counting everyone into one total.
- **\`find\`**: "is there a doctor on board?"; stops at the first.
- **\`push\`/\`pop\`**: attach or remove the last coach.

Gotcha: default \`sort()\` compares as strings, so "10" comes before "9".`,
          hi: `**ट्रेन के डिब्बे** सोचिए: S1, S2, S3, एक तय क्रम में। हर डिब्बे का नंबर (index) है, बस JavaScript में गिनती 0 से शुरू होती है।

Array methods स्टेशन के कर्मचारियों जैसे हैं:
- **\`map\`**: पैंट्री वाला जो हर यात्री को चाय देता है, हर यात्री के लिए एक आउटपुट।
- **\`filter\`**: टीटीई जो केवल कन्फ़र्म टिकट वालों की सूची बनाता है।
- **\`reduce\`**: गार्ड जो सभी यात्रियों को गिनकर एक संख्या देता है।
- **\`find\`**: "क्या ट्रेन में कोई डॉक्टर है?" पहला मिलते ही रुक जाओ।

ध्यान दें: डिफ़ॉल्ट \`sort()\` संख्याओं को string की तरह क्रम में लगाता है, इसलिए "10" पहले आता है "9" से।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Real data almost hamesha **list** mein aata hai: cart ke items, search results, notifications, transactions, comments. Agar har item ke liye alag variable banaoge (\`item1\`, \`item2\`...) toh na loop chala sakte ho, na pata hai kitne honge.

Array methods kyun, sirf loops kyun nahi?
- **Intent saaf**: \`orders.filter(o => o.status === "DELIVERED")\` padh ke turant samajh aata hai. Same kaam for loop mein 5 lines aur ek temporary array.
- **Kam bugs**: index manage nahi karna, toh off-by-one nahi.
- **Chaining**: \`filter → map → reduce\` ek pipeline jaisa padhta hai.
- **Immutability**: \`map/filter\` naya array dete hain, original safe rehta hai. React jaise frameworks isi pe depend karte hain (state ko mutate nahi karte).

Aur JSON APIs bhi lists arrays mein hi bhejti hain, toh frontend aur backend dono mein array skills roz kaam aati hain.`,
          en: `Real data almost always arrives as a **list**: cart items, search results, transactions. Separate variables per item cannot be looped and do not scale.

Why methods instead of only loops?
- **Clear intent**: \`orders.filter(o => o.status === "DELIVERED")\` reads like English.
- **Fewer bugs**: no index management, no off-by-one.
- **Chaining**: \`filter → map → reduce\` reads as a pipeline.
- **Immutability**: \`map\`/\`filter\` return new arrays, which frameworks like React rely on.

JSON APIs send lists as arrays, so these skills are used daily on both frontend and backend.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Flipkart / Amazon search page**: "Price: Low to High" \`products.sort((a, b) => a.price - b.price)\` hai, "4★ & above" \`filter(p => p.rating >= 4)\` hai, aur product cards \`products.map(p => <Card ... />)\` se render hote hain.
- **Swiggy cart**: total bill \`cart.reduce((sum, item) => sum + item.price * item.qty, 0)\`. "Kya cart mein koi non-veg item hai?" = \`cart.some(i => !i.isVeg)\`.
- **CRED / bank apps**: transaction history ko month ke hisaab se group karna aur \`filter\` se sirf debits dikhana.
- **Backend (Node.js)**: database se aaye rows ko API response shape mein badalna: \`rows.map(r => ({ id: r.id, name: r.full_name }))\` — taaki password jaise fields kabhi bahar na jaayein.`,
          en: `- **Flipkart / Amazon search**: "Low to High" is a numeric \`sort\`, "4★ & above" is a \`filter\`, and product cards are rendered with \`map\`.
- **Swiggy cart**: the bill is a \`reduce\`; "any non-veg item?" is \`some\`.
- **Banking apps like CRED**: filter debits and group transactions by month.
- **Node.js backends**: \`rows.map(r => ({ id: r.id, name: r.full_name }))\` reshapes database rows for API responses so sensitive fields never leak.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `JS array andar se ek **special object** hai jiski keys "0", "1", "2" hain aur ek auto-updating \`length\` property hai. \`typeof []\` isliye \`"object"\` deta hai.

Lekin V8 jaise engines smart hain: agar array mein sab same type ke items hain (sirf integers, ya sirf numbers), toh woh use andar se ek **fast contiguous memory block** (packed elements) ki tarah store karte hain, C array jaisa. Mixed types ya "holes" (\`arr[100] = 1\` jab length 3 thi) daalne se array slow mode mein chala jaata hai.

Methods ke baare mein:
- \`map(fn)\`: ek naya array banata hai, har index pe \`fn(item, index, array)\` call karke result rakhta hai.
- \`reduce(fn, initial)\`: ek **accumulator** leke chalta hai; har step pe \`acc = fn(acc, item)\`.
- \`sort()\` bina comparator ke items ko **string mein badal ke** compare karta hai. Comparator \`(a, b) => a - b\` negative de toh a pehle.
- **Mutating**: \`push, pop, shift, splice, sort, reverse\`. **Non-mutating**: \`map, filter, slice, concat, toSorted\`.`,
          en: `An array is a **special object** with keys "0", "1"... and an auto-updating \`length\`, which is why \`typeof []\` is \`"object"\`.

Engines like V8 store same-typed arrays as fast **contiguous memory**; mixing types or creating holes pushes them into slower modes.

- \`map(fn)\` builds a new array from \`fn(item, index, array)\`.
- \`reduce(fn, initial)\` carries an **accumulator**.
- \`sort()\` without a comparator **converts items to strings**; \`(a, b) => a - b\` sorts numbers.
- Mutating: \`push, pop, shift, splice, sort, reverse\`. Non-mutating: \`map, filter, slice, concat, toSorted\`.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Swiggy cart ke example se saare main methods:

- \`filter\`: sirf veg items.
- \`map\`: har item ka line total (\`price * qty\`).
- \`reduce\`: sab line totals jod ke bill. Initial value \`0\` dena zaroori hai.
- \`find\`: pehla item jiska price 200 se zyada hai.
- \`some\` / \`includes\`: true/false checks.
- \`sort\`: pehle default (galat, string sorting), phir comparator ke saath (sahi). \`[...nums]\` se copy banayi taaki original na badle.

Python mein list comprehension \`[x for x in cart if ...]\` filter+map ka kaam karti hai, \`sum()\` reduce ka, aur \`sorted()\` numbers ko by default sahi sort karta hai (JS jaisa gotcha nahi).`,
          en: `Using a food cart:
- \`filter\` keeps veg items, \`map\` computes line totals, \`reduce\` sums them (always pass the initial \`0\`).
- \`find\` returns the first item above ₹200; \`some\` and \`includes\` return booleans.
- \`sort\` is shown first without a comparator (string order, wrong) and then with \`(a, b) => a - b\`. \`[...nums]\` copies so the original is untouched.

Python uses list comprehensions for filter/map, \`sum()\` for reduce, and \`sorted()\` sorts numbers correctly by default.`,
        },
        codeJs: `const cart = [
  { name: "Paneer Tikka", price: 240, qty: 1, veg: true },
  { name: "Chicken Biryani", price: 320, qty: 2, veg: false },
  { name: "Masala Chai", price: 40, qty: 3, veg: true },
];

const vegNames = cart.filter((i) => i.veg).map((i) => i.name);
const lineTotals = cart.map((i) => i.price * i.qty);
const bill = lineTotals.reduce((sum, x) => sum + x, 0);
const costly = cart.find((i) => i.price > 200);

console.log("veg:", vegNames);
console.log("lines:", lineTotals, "bill:", bill);
console.log("first costly:", costly.name);
console.log("any non-veg?", cart.some((i) => !i.veg), [1, 2, 3].includes(2));

const nums = [10, 9, 1, 100];
console.log("default sort:", [...nums].sort());
console.log("numeric sort:", [...nums].sort((a, b) => a - b));
console.log("original:", nums);`,
        codePython: `cart = [
    {"name": "Paneer Tikka", "price": 240, "qty": 1, "veg": True},
    {"name": "Chicken Biryani", "price": 320, "qty": 2, "veg": False},
    {"name": "Masala Chai", "price": 40, "qty": 3, "veg": True},
]

veg_names = [i["name"] for i in cart if i["veg"]]
line_totals = [i["price"] * i["qty"] for i in cart]
bill = sum(line_totals)
costly = next(i for i in cart if i["price"] > 200)

print("veg:", veg_names)
print("lines:", line_totals, "bill:", bill)
print("first costly:", costly["name"])
print("any non-veg?", any(not i["veg"] for i in cart), 2 in [1, 2, 3])

nums = [10, 9, 1, 100]
print("string sort:", sorted(nums, key=str))
print("numeric sort:", sorted(nums))
print("original:", nums)`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `- **Numbers ko \`sort()\` bina comparator**: \`[10, 9, 1].sort()\` → \`[1, 10, 9]\`. Hamesha \`(a, b) => a - b\`.
- **\`sort\` original ko badal deta hai**: React state pe seedha \`sort()\` kiya toh bug. \`[...arr].sort()\` ya \`toSorted()\` use karo.
- **\`map\` mein return bhoolna**: \`arr.map(x => { x * 2 })\` → \`[undefined, undefined]\`.
- **\`reduce\` bina initial value**: khaali array pe \`TypeError: Reduce of empty array with no initial value\`.
- **\`map\` ko loop ki tarah use karna** jab result chahiye hi nahi. Side effect ke liye \`forEach\` ya \`for...of\`.
- **Array ko \`===\` se compare karna**: \`[1,2] === [1,2]\` false hai (alag references).
- **\`splice\` vs \`slice\` confuse karna**: \`splice\` original se items **nikaal** deta hai (mutate), \`slice\` copy deta hai.
- **\`includes\` objects ke liye**: \`cart.includes({ id: 1 })\` hamesha false; \`some(i => i.id === 1)\` use karo.`,
          en: `- \`sort()\` without a comparator on numbers sorts as strings.
- \`sort\` mutates the original; copy first or use \`toSorted()\`.
- Forgetting \`return\` inside a \`map\` callback with braces.
- \`reduce\` without an initial value throws on empty arrays.
- Using \`map\` just for side effects; use \`forEach\` or \`for...of\`.
- Comparing arrays with \`===\` compares references.
- Confusing \`splice\` (mutates) with \`slice\` (copies).
- \`includes\` with objects checks references; use \`some\`.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Array bugs debug karne ke tareeke:

1. **\`console.table(arr)\`**: array of objects ko ek saaf table mein dikhata hai. Cart ya API response dekhne ke liye best.
2. **Chain todo**: \`a.filter(...).map(...).reduce(...)\` galat result de raha hai? Har step ka result alag variable mein rakh ke log karo, pata chalega kis step pe data galat hua.
3. **Callback ke andar log**: \`arr.map((x, i) => { console.log(i, x); return x * 2; })\`.
4. **"Mera array apne aap badal gaya!"**: kahin \`sort/splice/reverse/push\` original pe chala hai, ya do variables same array ko point kar rahe hain. Shak ho toh \`structuredClone(arr)\` se copy karke check karo.
5. **\`undefined\` items**: map callback return nahi kar raha, ya index range ke bahar hai.
6. **DevTools gotcha**: \`console.log(arr)\` ko baad mein expand karne pe *current* value dikhti hai, log ke time wali nahi. Exact snapshot ke liye \`console.log(JSON.stringify(arr))\`.`,
          en: `1. \`console.table(arr)\` shows arrays of objects as a table.
2. Break chains into variables and log each step.
3. Log inside callbacks with the index.
4. "My array changed by itself!": something called \`sort/splice/reverse\`, or two variables share one array.
5. \`undefined\` items mean a missing return or an out-of-range index.
6. DevTools shows the current value when you expand a logged array; use \`JSON.stringify\` for a snapshot.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Methods vs for loop**: methods readable hain, lekin \`filter().map()\` do baar list pe chalta hai aur beech mein ek extra array banata hai. 100 items pe farak zero, 10 lakh items wale hot path mein ek \`for\` loop better ho sakta hai. Pehle readability, measure karke optimize.
- **Array vs Set**: "yeh value hai ya nahi" baar-baar check karna hai? \`arr.includes\` har baar poori list scan karta hai (O(n)); \`Set.has\` O(1) hai. Duplicates hatane ke liye bhi \`new Set(arr)\`.
- **Array vs Object/Map**: id se item dhoondhna hai? \`users.find(u => u.id === 7)\` O(n) hai; \`usersById[7]\` ya \`Map\` O(1).
- **Mutating vs non-mutating**: mutation fast aur memory-friendly hai, lekin shared data mein surprise bugs deta hai. UI state mein non-mutating hi chalao.
- **\`reduce\` ka overuse**: har cheez reduce se likhne se code puzzle ban jaata hai; simple loop ya \`map + sum\` zyada saaf ho sakta hai.`,
          en: `- **Methods vs loops**: methods are readable; chained calls create intermediate arrays, which only matters in hot paths over huge data.
- **Array vs Set**: repeated membership checks are O(n) with \`includes\` but O(1) with \`Set.has\`; \`new Set\` also removes duplicates.
- **Array vs Map/object** for lookup by id.
- **Mutation** is fast but causes surprises with shared state; avoid it for UI state.
- Do not force everything into \`reduce\`; plain loops can be clearer.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real React + Node project (jaise ek job portal) mein arrays har jagah hain:

\`\`\`js
// Backend: DB rows ko safe API shape mein
const jobs = rows
  .filter((r) => r.is_active)
  .map((r) => ({ id: r.id, title: r.title, salary: r.salary_lpa }));

// Frontend: filters + sort (state ko mutate nahi kiya)
const visible = jobs
  .filter((j) => j.salary >= minSalary)
  .toSorted((a, b) => b.salary - a.salary);
\`\`\`

React mein \`visible.map(job => <JobCard key={job.id} ... />)\` se list render hoti hai; \`key\` unique id honi chahiye, index nahi.

Code review checklist: comparator ke bina sort, state pe mutation (\`push\`, \`sort\`), \`find\` ka \`undefined\` handle na karna, aur loop ke andar \`includes\` (O(n²)) jahan \`Set\` lagna chahiye tha.`,
          en: `In a React + Node job portal: the backend filters active rows and maps them into a safe API shape; the frontend filters by salary and uses \`toSorted\` so state is never mutated. Lists render with \`map\` and a unique \`key\` (an id, not the index).

Review checklist: sort without comparator, mutating state with \`push\`/\`sort\`, not handling \`find\` returning \`undefined\`, and \`includes\` inside loops where a \`Set\` belongs.`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "filter → map → reduce pipeline",
      steps: [
        { title: "Original cart", description: "[{chai, 40, veg}, {biryani, 320, non-veg}, {paneer, 240, veg}] — 3 items. Original array badlega nahi.", highlight: "cart" },
        { title: "filter(veg)", description: "Har item pe condition chali. Biryani fail hua. Naya array: [chai, paneer] — 2 items.", highlight: ".filter(i => i.veg)" },
        { title: "map(price)", description: "Har bache item ka price nikala. Naya array: [40, 240]. Count same raha (2).", highlight: ".map(i => i.price)" },
        { title: "reduce start", description: "Accumulator sum = 0 (initial value). Pehla item 40: sum = 0 + 40 = 40.", highlight: "sum = 0" },
        { title: "reduce finish", description: "Doosra item 240: sum = 40 + 240 = 280. List khatam, final answer 280 (ek single number).", highlight: "280" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the index of the first element in a JavaScript array?",
        options: ["1", "0", "-1", "It depends on the array"],
        correct: [1],
        explanation: "JS arrays zero-indexed hain: pehla item `arr[0]`, last item `arr[arr.length - 1]`.",
        tags: ["index"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which method returns a NEW array with only the elements that pass a test?",
        options: ["map", "filter", "forEach", "push"],
        correct: [1],
        explanation: "`filter` condition pass karne wale items ka naya array deta hai. `map` har item ko transform karta hai (count same), `forEach` kuch return nahi karta, `push` original mein add karta hai.",
        tags: ["filter"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Which of these methods MUTATES the original array?",
        options: ["map", "slice", "sort", "filter"],
        correct: [2],
        explanation: "`sort` original array ko hi re-order kar deta hai (aur wahi array return karta hai). map, slice, filter naya array dete hain. Copy pe sort chahiye toh `[...arr].sort()` ya `toSorted()`.",
        tags: ["mutation"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which calls return a boolean (true/false)? (Select all that apply)",
        options: ["arr.includes(5)", "arr.some(x => x > 5)", "arr.find(x => x > 5)", "arr.every(x => x > 0)", "arr.indexOf(5)"],
        correct: [0, 1, 3],
        explanation: "includes, some, every boolean dete hain. `find` item khud (ya undefined) deta hai, aur `indexOf` number (index ya -1).",
        tags: ["search"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `const nums = [10, 9, 1, 100];
console.log(nums.sort());`,
        codeLanguage: "javascript",
        options: ["[ 1, 9, 10, 100 ]", "[ 1, 10, 100, 9 ]", "[ 100, 10, 9, 1 ]", "[ 10, 9, 1, 100 ]"],
        correct: [1],
        explanation: "Bina comparator ke `sort()` har number ko string mein badal ke dictionary order mein lagata hai: \"1\" < \"10\" < \"100\" < \"9\". Numbers ke liye `sort((a, b) => a - b)` likho.",
        tags: ["sort"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `const prices = [100, 250, 40];
const total = prices
  .filter((p) => p > 50)
  .map((p) => p * 2)
  .reduce((sum, p) => sum + p, 0);
console.log(total, prices.length);`,
        codeLanguage: "javascript",
        options: ["780 3", "700 3", "700 2", "350 3"],
        correct: [1],
        explanation: "filter → [100, 250] (40 hata). map → [200, 500]. reduce → 700. Original `prices` nahi badla kyunki teeno methods naya array/value dete hain, toh length abhi bhi 3.",
        tags: ["chaining"],
      },
      {
        type: "SCENARIO",
        difficulty: 3,
        prompt: "You need to check, for each of 50,000 orders, whether its userId is in a list of 10,000 blocked user ids. The current code uses blockedIds.includes(order.userId) and is slow. What is the best fix?",
        options: [
          "Sort blockedIds first",
          "Convert blockedIds to a Set once and use set.has(order.userId)",
          "Use for...in instead of includes",
          "Use blockedIds.find instead of includes",
        ],
        correct: [1],
        explanation: "`includes` har call pe poori list scan karta hai: 50,000 × 10,000 = 50 crore comparisons. `Set` ek baar banao, `has` O(1) hai. `find` bhi linear hi hai.",
        tags: ["performance", "set"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps of `[3, 4].reduce((acc, x) => acc + x, 10)`.",
        options: [
          "acc starts as the initial value 10",
          "Callback runs with acc = 10, x = 3 and returns 13",
          "Callback runs with acc = 13, x = 4 and returns 17",
          "No elements left, reduce returns 17",
        ],
        explanation: "Initial value se accumulator shuru hota hai, har item pe callback ka return naya accumulator ban jaata hai, aur list khatam hone pe last accumulator hi result hai.",
        tags: ["reduce"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain the difference between map and forEach, and when you would choose each.",
        keywords: ["new array", "return value", "undefined", "side effects", "transform"],
        explanation: "`map` har item ke callback ka return value leke **naya array** deta hai, transform ke liye. `forEach` sirf callback chalata hai aur `undefined` return karta hai, side effects (log, DB call) ke liye. Agar result use nahi ho raha toh map galat choice hai.",
        tags: ["map", "forEach"],
      },
    ],
    buildTask: {
      title: "Unique sorted roll numbers",
      description: `College ki attendance sheet mein roll numbers repeat ho gaye hain aur order bhi random hai. Function \`uniqueSorted(arr)\` banao jo:

1. Duplicates hata de.
2. Numbers ko **ascending (chhote se bade)** numeric order mein sort kare.
3. Naya array return kare (original ko mat badlo).

Example: \`uniqueSorted([10, 9, 1, 100, 9])\` → \`[1, 9, 10, 100]\`

Dhyan do: JS ka default \`sort()\` yahan galat answer dega!`,
      functionName: "uniqueSorted",
      starterJs: `function uniqueSorted(arr) {
  // remove duplicates, then sort numerically
  return arr;
}`,
      starterPython: `def uniqueSorted(arr):
    # remove duplicates, then sort numerically
    return arr`,
      tests: [
        { name: "duplicates", args: [[3, 1, 2, 3, 1]], expected: [1, 2, 3] },
        { name: "numeric not string sort", args: [[10, 9, 1, 100, 9]], expected: [1, 9, 10, 100] },
        { name: "empty", args: [[]], expected: [] },
        { name: "negatives and zero", args: [[-5, 0, -5, 2]], expected: [-5, 0, 2] },
        { name: "single item", args: [[7]], expected: [7], hidden: true },
        { name: "decimals", args: [[2.5, 1, 2.5, 10]], expected: [1, 2.5, 10], hidden: true },
      ],
      hints: [
        "Set sirf unique values rakhta hai. Aur numbers sort karne ke liye comparator (a, b) => a - b chahiye.",
        "Pehle [...new Set(arr)] se duplicates hatao (yeh naya array bhi hai), phir us copy ko numeric sort karo.",
        "return [...new Set(arr)].sort((a, b) => a - b);  // Python: return sorted(set(arr))",
      ],
      explainQuestions: [
        { question: "Why does the default sort() give the wrong order for numbers?", keywords: ["string", "comparator", "dictionary order"] },
        { question: "How did you remove duplicates, and what is its time complexity?", keywords: ["set", "unique", "o(n)"] },
        { question: "Does your function change the original array? How do you know?", keywords: ["new array", "copy", "mutate"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "Explain map, filter and reduce with an example.",
        short: "All three are higher-order array methods that take a callback and do not mutate the original array. map transforms each element and returns a new array of the same length. filter returns a new array with only elements for which the callback returns truthy. reduce folds all elements into a single value using an accumulator, like summing a cart.",
        deep: `\`\`\`js
const cart = [{ p: 100, veg: true }, { p: 300, veg: false }];
cart.map(i => i.p);                      // [100, 300]
cart.filter(i => i.veg);                 // [{ p: 100, veg: true }]
cart.reduce((sum, i) => sum + i.p, 0);   // 400
\`\`\`
- Always pass an initial value to \`reduce\`; without it an empty array throws.
- Chaining creates intermediate arrays; usually fine, but a single loop can be faster on huge data.
- \`map\` can be implemented with \`reduce\`, showing reduce is the most general.`,
        followUps: ["Implement map using reduce.", "What happens if you call reduce on an empty array without an initial value?", "How would you group items by a key with reduce?"],
        commonMistake: "Using map for side effects and ignoring the returned array.",
        keywords: ["higher-order", "callback", "new array", "accumulator", "immutable"],
        difficulty: 1,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
      {
        question: "Why does [10, 9, 1].sort() return [1, 10, 9]?",
        short: "Without a comparator, Array.prototype.sort converts elements to strings and sorts them by UTF-16 code unit order, so '10' comes before '9'. For numbers you pass a comparator like (a, b) => a - b. Also note sort mutates the array in place.",
        deep: `- The comparator returns negative (a first), positive (b first) or 0.
- \`sort\` is stable since ES2019.
- \`sort\` mutates; use \`[...arr].sort(fn)\` or ES2023 \`toSorted(fn)\` for a copy.
- For strings with accents or locales, use \`a.localeCompare(b)\`.`,
        followUps: ["How would you sort objects by two fields?", "What is a stable sort and why does it matter?"],
        commonMistake: "Forgetting that sort mutates and returns the same array reference.",
        keywords: ["string conversion", "comparator", "in place", "stable", "toSorted"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "SDE"],
      },
    ],
    promptCard: {
      title: "Explain an array method chain step by step",
      category: "LEARNING",
      task: "Get an AI to walk through a filter/map/reduce chain and show the intermediate array after every step.",
      whenToUse: "Jab koi chained array code (filter → map → reduce, ya sort) samajh nahi aa raha, ya output expected se alag aa raha hai aur tumhe har step ka data dekhna hai.",
      template: `You are a patient JavaScript tutor for a beginner.

Here is my array code:
\`\`\`js
[PASTE_CODE]
\`\`\`

Sample input data:
[SAMPLE_INPUT]

Please:
1. Run through the chain one method at a time and show the exact intermediate array/value after each step.
2. For each step, say whether it mutates the original array or returns a new one.
3. Point out any gotchas (sort without comparator, missing return in a callback, reduce without initial value).
4. Show the final output, then give one simpler or more readable way to write it if one exists.
Explain in simple Hinglish, but keep code and output in English.`,
      variables: [
        { key: "PASTE_CODE", label: "Your array method chain" },
        { key: "SAMPLE_INPUT", label: "A small sample input array" },
      ],
      whyItWorks: [
        { part: "Show the intermediate array after each step", why: "Chain ke beech ka data dikhne se pata chalta hai bug exactly kis method mein hai." },
        { part: "Mutates or returns new", why: "Mutation se hone wale 'array apne aap badal gaya' bugs pakde jaate hain." },
        { part: "List of known gotchas", why: "AI ko specific common bugs check karne ko bolne se generic jawab ki jagah targeted review milta hai." },
      ],
      verifyChecklist: [
        "Code ko khud node mein chala ke final output match karo.",
        "Har intermediate step console.log karke AI ke batayi values se compare karo.",
        "Suggested rewrite ko same input pe chala ke same output confirm karo.",
      ],
      sampleOutput: `Step 1 – filter(p => p > 50): [100, 250] (new array; 40 removed)
Step 2 – map(p => p * 2): [200, 500] (new array)
Step 3 – reduce((s, p) => s + p, 0): 0 → 200 → 700
Final: 700. Original prices array is unchanged.
Gotcha check: reduce has an initial value ✔, no sort used ✔.`,
    },
  },
  // ───────────────────────────────────────────────────────────────────────────
  // 6. Objects
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "js-objects",
    estMinutes: 45,
    difficulty: 2,
    prerequisites: ["js-arrays"],
    objectives: [
      "Object banana, dot aur bracket notation se properties padhna/likhna",
      "Object.keys, Object.values, Object.entries se objects pe loop chalana",
      "Reference vs copy samajhna aur spread se shallow copy banana",
      "Optional chaining (?.) se missing data safely handle karna",
    ],
    technicalDefinition:
      "A JavaScript object is a mutable collection of key-value properties, where keys are strings or symbols and values can be any type, accessed by dot or bracket notation and passed around by reference.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Object** ek cheez ki saari details ek jagah rakhne ka tareeka hai, **key: value** pairs mein:

\`\`\`js
const user = { name: "Riya", city: "Pune", age: 21 };
\`\`\`

Yahan \`name\`, \`city\`, \`age\` **keys** (properties) hain aur "Riya", "Pune", 21 unki **values**. Value kuch bhi ho sakti hai: number, string, array, doosra object, ya function bhi (tab use **method** kehte hain).

Padhne ke do tareeke: \`user.name\` (dot) aur \`user["name"]\` (bracket, jab key variable mein ho ya usmein space/dash ho). Objects **reference** se pass hote hain: \`const b = a\` copy nahi banata, dono same object ko point karte hain.`,
          en: `An **object** groups all details of one thing as **key: value** pairs, e.g. \`{ name: "Riya", city: "Pune", age: 21 }\`. Keys are property names; values can be anything, including arrays, other objects or functions (called **methods**).

Read properties with dot notation \`user.name\` or bracket notation \`user["name"]\` (needed when the key is in a variable or has spaces). Objects are handled **by reference**: \`const b = a\` does not copy, both names point to the same object.`,
          hi: `**Object** किसी एक चीज़ की सारी जानकारी एक जगह **key: value** जोड़ों में रखने का तरीका है, जैसे \`{ name: "Riya", city: "Pune", age: 21 }\`।

यहाँ name, city और age **keys** हैं और उनके आगे लिखी चीज़ें उनकी **values** हैं। Value कुछ भी हो सकती है: number, string, array, दूसरा object या function (तब उसे **method** कहते हैं)।

पढ़ने के दो तरीके हैं: \`user.name\` और \`user["name"]\`। Objects **reference** से पास होते हैं, यानी \`const b = a\` कॉपी नहीं बनाता, दोनों एक ही object की ओर इशारा करते हैं।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Aadhaar card** socho. Ek card pe ek insaan ki saari details hain, har detail ke aage ek label:

- Naam: Riya Sharma
- DOB: 12-05-2004
- Address: Pune
- Aadhaar No: XXXX-XXXX-1234

Yeh exactly object hai: label = **key**, detail = **value**. Tum "Naam" dekh ke seedha naam padh lete ho, poora card line by line padhne ki zaroorat nahi. Array mein position (index) se dhoondhte the, object mein **naam (key) se**.

Ab reference wali baat: tumne apne dost ko card ki **photocopy** nahi di, balki apna asli card de diya (\`const b = a\`). Dost ne pen se address badal diya, toh tumhara card bhi badal gaya, kyunki card ek hi hai!

Photocopy chahiye toh spread: \`const copy = { ...user }\`. Lekin dhyan do, yeh **shallow** photocopy hai: andar koi aur object (jaise address object) ho, toh woh abhi bhi shared rehta hai.`,
          en: `Think of an **Aadhaar card**: each line has a label and a detail (Name, DOB, Address). That is an object: label = **key**, detail = **value**. You read a detail by its label, not by position like in an array.

Reference: you did not give your friend a photocopy, you gave the original card (\`const b = a\`). If they change the address, your card changes too, because there is only one card.

For a photocopy use spread: \`{ ...user }\`. It is **shallow**: nested objects inside are still shared.`,
          hi: `**आधार कार्ड** के बारे में सोचिए। एक कार्ड पर एक इंसान की सारी जानकारी है, हर जानकारी के आगे एक लेबल: नाम, जन्मतिथि, पता।

यही object है: लेबल **key** है और जानकारी **value**। आप "नाम" देखकर सीधे नाम पढ़ लेते हैं, पूरा कार्ड पढ़ने की ज़रूरत नहीं।

Reference वाली बात: आपने दोस्त को फ़ोटोकॉपी नहीं, अपना असली कार्ड दे दिया (\`const b = a\`)। दोस्त ने पता बदल दिया तो आपका कार्ड भी बदल गया, क्योंकि कार्ड एक ही है। फ़ोटोकॉपी चाहिए तो spread इस्तेमाल करें: \`{ ...user }\`, लेकिन यह ऊपरी (shallow) कॉपी है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Socho ek user ka data alag-alag variables mein: \`userName\`, \`userCity\`, \`userAge\`, \`userPhone\`... Ab 100 users ho gaye toh? Ya ek function ko user ka saara data dena hai? 10 parameters?

Objects yeh problem solve karte hain:
- **Related data ek saath**: ek user = ek object. Function ko bas \`user\` do.
- **Naam se access**: \`order.status\` padhna \`order[3]\` se kahin zyada clear hai.
- **Real duniya modelling**: product, order, restaurant, ticket — sab naturally objects hain.
- **JSON**: poore internet pe APIs data JSON mein bhejti hain, jo literally JS object jaisa format hai. \`JSON.parse\` se seedha object milta hai.
- **Fast lookup**: id se kuch dhoondhna ho toh \`usersById["u42"]\` turant milta hai, array mein poora scan karna padta.

JS mein almost sab kuch (arrays, functions, dates) andar se object hi hai, isliye objects samajhna JS samajhne ki chaabi hai.`,
          en: `Without objects a user's data would be scattered across \`userName\`, \`userCity\`, \`userAge\`... and functions would need ten parameters.

Objects give:
- **Grouped data**: one user = one object.
- **Access by name**: \`order.status\` is clearer than \`order[3]\`.
- **Natural modelling** of products, orders, tickets.
- **JSON**: APIs speak JSON, which maps directly to JS objects.
- **Fast lookup by key**, e.g. \`usersById["u42"]\`.

Almost everything in JS is an object underneath, so objects are key to understanding the language.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Zomato / Swiggy API**: har restaurant ek JSON object hai: \`{ id, name, rating, cuisines: [...], location: { lat, lng } }\`. Frontend \`restaurant.location?.lat\` jaise nested access karta hai.
- **Redux / React state (Flipkart, Myntra web)**: cart state ek object: \`{ items: [...], coupon: null, total: 0 }\`. Update karte waqt spread se naya object banate hain: \`{ ...state, coupon: "SAVE50" }\` taaki React change detect kar sake.
- **Config files**: \`package.json\`, ESLint config, Next.js config — sab objects. Feature flags bhi: \`{ showNewCheckout: true, darkMode: false }\`.
- **Lookup tables**: GST rates by category \`{ food: 5, electronics: 18 }\`, ya error code → message mapping, jo if/else chain ki jagah lete hain.`,
          en: `- **Zomato / Swiggy APIs**: each restaurant is a JSON object with nested data like \`location: { lat, lng }\`, accessed with optional chaining.
- **React / Redux state (Flipkart, Myntra web)**: cart state is an object updated immutably with spread, \`{ ...state, coupon: "SAVE50" }\`, so React detects the change.
- **Config files**: \`package.json\`, ESLint and Next.js configs, feature flags.
- **Lookup tables** like GST rates by category replace long if/else chains.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Andar ki baatein:

1. **Heap aur reference**: object heap memory mein banta hai; variable mein sirf uska address (reference) hota hai. \`const b = a\` address copy karta hai, object nahi. \`{} === {}\` false hai kyunki do alag addresses.
2. **Keys hamesha string (ya Symbol)**: \`obj[1]\` aur \`obj["1"]\` same property hain. Number keys bhi string ban jaati hain.
3. **Hidden classes (V8)**: engine same shape (same keys, same order) wale objects ke liye ek internal "shape" banata hai, jisse property access fast hota hai. Baad mein randomly properties add/delete karne se yeh optimization toot sakta hai.
4. **Prototype chain**: \`user.toString()\` tumne nahi likha, phir bhi chalta hai. Property object mein na mile toh JS uske **prototype** (\`Object.prototype\`) mein dhoondhti hai.
5. **Spread \`{ ...a }\`** ek naya object banata hai aur top-level properties copy karta hai. Nested objects ke references hi copy hote hain (shallow). Deep copy ke liye \`structuredClone(a)\`.`,
          en: `1. Objects live on the heap; variables hold references. \`{} === {}\` is false.
2. Keys are always strings or symbols; \`obj[1]\` equals \`obj["1"]\`.
3. V8 uses **hidden classes** for objects with the same shape, making property access fast; adding and deleting properties ad hoc can deoptimise.
4. Missing properties are looked up on the **prototype chain**, which is why \`user.toString()\` works.
5. Spread makes a **shallow** copy; use \`structuredClone\` for deep copies.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Code mein objects ke saare common kaam hain:

- \`order\` object banaya, \`order.status\` (dot) aur \`order[field]\` (bracket, key variable mein) se padha.
- Nayi property add ki (\`order.rider = ...\`), aur \`delete\` se hatayi.
- \`Object.entries\` + \`for...of\` se har key-value pe loop.
- \`alias = order\` reference hai: alias badla toh order bhi badla. \`copy = { ...order }\` alag object hai.
- \`order.address?.pin\`: address null hai toh crash nahi, \`undefined\`.
- Method \`summary()\` ke andar \`this\` order object ko point karta hai.

Python mein yeh kaam **dict** karta hai: \`d["key"]\`, \`.items()\`, \`dict(d)\` / \`{**d}\` shallow copy, aur \`d.get("key")\` missing key pe crash nahi karta.`,
          en: `The code creates an \`order\` object, reads with dot and bracket notation, adds and deletes properties, loops with \`Object.entries\`, shows that \`alias = order\` shares the same object while \`{ ...order }\` copies it, uses \`?.\` to safely read a null address, and shows a method using \`this\`.

In Python a **dict** does this job: \`d["key"]\`, \`.items()\`, \`{**d}\` for a shallow copy and \`d.get()\` for safe access.`,
        },
        codeJs: `const order = {
  id: "ZMT-101",
  status: "PREPARING",
  total: 450,
  address: null,
  summary() {
    return this.id + " is " + this.status;
  },
};

const field = "total";
console.log(order.status, order[field]);

order.rider = "Ramesh";
delete order.total;
console.log(Object.keys(order));

for (const [key, value] of Object.entries({ veg: 2, nonVeg: 1 })) {
  console.log(key, "=", value);
}

const alias = order;
const copy = { ...order };
alias.status = "DELIVERED";
console.log(order.status, copy.status);

console.log(order.address?.pin, order.summary());`,
        codePython: `order = {
    "id": "ZMT-101",
    "status": "PREPARING",
    "total": 450,
    "address": None,
}

field = "total"
print(order["status"], order[field])

order["rider"] = "Ramesh"
del order["total"]
print(list(order.keys()))

for key, value in {"veg": 2, "nonVeg": 1}.items():
    print(key, "=", value)

alias = order
copy = {**order}
alias["status"] = "DELIVERED"
print(order["status"], copy["status"])

address = order.get("address")
print(address.get("pin") if address else None, order["id"] + " is " + order["status"])`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `- **Copy samajh ke reference banana**: \`const newState = state; newState.count++\` original state badal deta hai. Spread se copy banao.
- **Shallow copy pe bharosa**: \`{ ...user }\` ke baad \`copy.address.city = "Delhi"\` original ka address bhi badal dega. Nested ke liye \`structuredClone\` ya nested spread.
- **Variable key ke saath dot**: \`const key = "city"; user.key\` → \`undefined\` (yeh literally "key" naam ki property dhoondhta hai). Sahi: \`user[key]\`.
- **Missing nested property pe crash**: \`user.address.pin\` jab address null ho → \`TypeError: Cannot read properties of null\`. \`user.address?.pin\` use karo.
- **Objects ko \`===\` se compare**: same content ke do objects bhi equal nahi. Specific fields compare karo.
- **Objects pe \`for...of\`**: "not iterable" error. \`Object.entries\` use karo.
- **\`length\` expect karna**: objects ki length nahi hoti; \`Object.keys(obj).length\` likho.`,
          en: `- Assigning instead of copying, then mutating shared state.
- Trusting shallow copies with nested objects.
- \`user.key\` when the key is in a variable; use \`user[key]\`.
- Crashing on \`user.address.pin\` when address is null; use \`?.\`.
- Comparing objects with \`===\`.
- \`for...of\` on plain objects; use \`Object.entries\`.
- Expecting \`.length\` on objects; use \`Object.keys(obj).length\`.
- Using dot notation for keys with spaces or dashes; use brackets.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Object bugs pakadne ke tareeke:

1. **"Cannot read properties of undefined (reading 'x')"**: error mein jo naam hai uske **pehle** wali cheez undefined hai. \`user.address.pin\` mein error aaya toh \`user.address\` undefined hai. Wahan log lagao.
2. **Poora object dekho**: \`console.log(JSON.stringify(obj, null, 2))\` sundar format mein exact snapshot dikhata hai. \`console.dir(obj, { depth: null })\` Node mein deeply nested objects ke liye.
3. **Key spelling check**: API se \`user_name\` aa raha hai aur tum \`userName\` padh rahe ho? \`Object.keys(obj)\` print karke dekho.
4. **"Mera object kisi aur ne badal diya"**: same reference kahin aur mutate ho raha hai. Debug ke liye \`Object.freeze(obj)\` laga do; strict mode mein jo line mutate karegi woh error degi aur pakdi jayegi.
5. **DevTools**: breakpoint pe Scope panel mein object expand karke saari properties aur prototype dekh sakte ho.`,
          en: `1. "Cannot read properties of undefined (reading 'x')" means the thing **before** \`.x\` is undefined; log it.
2. Print a snapshot with \`JSON.stringify(obj, null, 2)\` or \`console.dir(obj, { depth: null })\` in Node.
3. Check key spelling with \`Object.keys(obj)\` (e.g. \`user_name\` vs \`userName\`).
4. Unexpected mutation? Temporarily \`Object.freeze(obj)\`; in strict mode the offending write throws.
5. Expand objects in the DevTools Scope panel at a breakpoint.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Object vs Map**: plain object simple hai aur JSON mein seedha jaata hai. Lekin keys sirf string hoti hain, aur bahut zyada add/delete wale dynamic dictionary ke liye \`Map\` better hai: koi bhi type ki key, \`size\` property, aur insertion order guaranteed.
- **Object vs Array**: order aur position matter karta hai → array. Naam/id se lookup → object.
- **Mutation vs immutable update**: \`obj.x = 1\` fast aur simple hai. Lekin React/Redux state mein naya object chahiye (\`{ ...obj, x: 1 }\`) taaki change detect ho. Bahut nested state ke liye Immer jaisi library.
- **Shallow vs deep copy**: spread sasta hai; \`structuredClone\` pura copy karta hai lekin slow hai aur functions copy nahi kar sakta. Zaroorat jitna hi copy karo.
- **Optional chaining ka overuse**: har jagah \`?.\` lagane se asli bugs chhup jaate hain. Jo data hamesha hona chahiye, uske missing hone pe error aana better hai.`,
          en: `- **Object vs Map**: objects are simple and JSON-friendly; \`Map\` suits dynamic dictionaries with frequent add/delete, any key type and a \`size\`.
- **Object vs array**: position matters → array; lookup by name → object.
- **Mutation vs immutable update**: mutation is simple, but React state needs new objects.
- **Shallow vs deep copy**: copy only as deep as needed; \`structuredClone\` is slower and skips functions.
- Overusing \`?.\` hides real bugs when data should always exist.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real project mein ek common kaam: API se list aayi, use **id se lookup object** mein badlo aur **group** karo:

\`\`\`js
// API response: array of orders
const byId = {};
for (const o of orders) byId[o.id] = o;   // O(1) lookup later

const byStatus = {};
for (const o of orders) {
  (byStatus[o.status] ??= []).push(o);    // group into arrays
}
// byStatus = { PREPARING: [...], DELIVERED: [...] }
\`\`\`

Dashboard pe "Preparing (4) | Delivered (12)" tabs isi se bante hain. React state update: \`setOrder(prev => ({ ...prev, status: "DELIVERED" }))\`.

Backend pe response bhejne se pehle object se sensitive fields hatate hain: \`const { passwordHash, ...safeUser } = user; res.json(safeUser);\`. Code review mein dekha jaata hai: state mutation, \`?.\` ki kami ya overuse, aur galti se poora DB object client ko bhej dena.`,
          en: `A common real task: turn an API list into an **id lookup object** and **group** it by status, which powers dashboard tabs like "Preparing (4) | Delivered (12)". React updates use \`setOrder(prev => ({ ...prev, status: "DELIVERED" }))\`.

On the backend, sensitive fields are stripped before responding: \`const { passwordHash, ...safeUser } = user\`. Reviewers check for state mutation, missing or excessive \`?.\`, and leaking full database objects to clients. Getting these patterns right early saves many production bugs later.`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "Reference vs copy in memory",
      steps: [
        { title: "Object banaya", description: "const a = { city: 'Pune' }. Heap mein object bana (address #A1). Variable a ke paas sirf #A1 hai.", highlight: "a → #A1" },
        { title: "const b = a", description: "Koi naya object nahi bana! b ko bhi address #A1 mila. Dono same object ko point kar rahe hain.", highlight: "b → #A1" },
        { title: "b.city = 'Delhi'", description: "#A1 wala object badla. Ab a.city bhi 'Delhi' hai, kyunki a aur b ek hi object dekh rahe hain.", highlight: "a.city === 'Delhi'" },
        { title: "const c = { ...a }", description: "Spread ne naya object banaya (address #C7) aur top-level properties copy ki. c ab alag hai.", highlight: "c → #C7" },
        { title: "c.city = 'Mumbai'", description: "Sirf #C7 badla. a aur b abhi bhi 'Delhi'. Lekin agar andar nested object hota, toh woh dono mein shared rehta (shallow copy).", highlight: "a.city still 'Delhi'" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Given `const key = \"city\";`, which expression reads the city property of `user`?",
        options: ["user.key", "user[key]", "user.[key]", "user->key"],
        correct: [1],
        explanation: "Jab key variable mein ho toh bracket notation: `user[key]`. `user.key` literally \"key\" naam ki property dhoondhega jo exist nahi karti, toh undefined.",
        tags: ["bracket-notation"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `user.address?.pin` return when `user.address` is null?",
        options: ["null", "undefined", "It throws a TypeError", "An empty string"],
        correct: [1],
        explanation: "Optional chaining `?.` dekhta hai ki left side null/undefined hai, toh aage padhne ki jagah seedha `undefined` return kar deta hai. Bina `?.` ke TypeError aata.",
        tags: ["optional-chaining"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "What is `{ a: 1 } === { a: 1 }`?",
        options: ["true", "false", "TypeError", "undefined"],
        correct: [1],
        explanation: "Objects reference se compare hote hain, content se nahi. Do alag object literals = do alag memory addresses, toh false.",
        tags: ["reference"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these create a NEW object rather than another reference to `user`? (Select all that apply)",
        options: ["const a = user;", "const b = { ...user };", "const c = Object.assign({}, user);", "const d = structuredClone(user);"],
        correct: [1, 2, 3],
        explanation: "Spread aur Object.assign shallow copy banate hain, structuredClone deep copy. Sirf `const a = user` reference copy karta hai, naya object nahi.",
        tags: ["copy"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `const a = { name: "Riya", city: "Pune" };
const b = a;
const c = { ...a };
b.city = "Delhi";
console.log(a.city, c.city);`,
        codeLanguage: "javascript",
        options: ["Pune Pune", "Delhi Pune", "Delhi Delhi", "Pune Delhi"],
        correct: [1],
        explanation: "`b` same object ka reference hai, toh `b.city` badalne se `a.city` bhi \"Delhi\". `c` spread se bana alag object hai, woh \"Pune\" hi rehta hai.",
        tags: ["reference", "spread"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `const user = { name: "Aman", address: null };
console.log(user.address?.pin);
console.log(user["na" + "me"]);
console.log(Object.keys(user).length);`,
        codeLanguage: "javascript",
        options: ["null\nAman\n2", "undefined\nAman\n2", "undefined\nundefined\n2", "TypeError"],
        correct: [1],
        explanation: "`?.` null pe rukta hai aur `undefined` deta hai. Bracket notation mein expression chal sakta hai: \"na\" + \"me\" = \"name\", toh \"Aman\". Keys do hain: name aur address.",
        tags: ["optional-chaining", "bracket-notation"],
      },
      {
        type: "SCENARIO",
        difficulty: 3,
        prompt: "In a React app, `const next = state; next.items.push(item); setState(next);` does not re-render the cart. What is the correct fix?",
        options: [
          "Call setState twice",
          "Create new objects: setState({ ...state, items: [...state.items, item] })",
          "Use var instead of const",
          "Use Object.freeze(state) before pushing",
        ],
        correct: [1],
        explanation: "`next` same reference hai, toh React ko lagta hai kuch badla hi nahi. Naya object aur naya items array banao (immutable update), tab reference badlega aur re-render hoga.",
        tags: ["immutability", "react"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps JavaScript takes to evaluate `user.toString()` when user is a plain object without its own toString.",
        options: [
          "Look for a toString property directly on user",
          "Not found, so move to user's prototype (Object.prototype)",
          "Find toString on Object.prototype",
          "Call it with this set to user",
        ],
        explanation: "Property pehle object khud mein dhoondhi jaati hai, na mile toh prototype chain mein upar. Object.prototype pe toString mil jaata hai aur `this = user` ke saath call hota hai.",
        tags: ["prototype"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain the difference between a shallow copy and a deep copy of an object, with an example of when a shallow copy causes a bug.",
        keywords: ["top-level", "nested", "reference", "shared", "structuredclone"],
        explanation: "Shallow copy (spread) sirf top-level properties copy karta hai; nested objects ka reference shared rehta hai. Toh `copy.address.city = 'X'` original ka address bhi badal deta hai. Deep copy (`structuredClone`) har level pe naya object banata hai.",
        tags: ["copy"],
      },
    ],
    buildTask: {
      title: "Group students by city",
      description: `Placement cell ko students ki list city-wise chahiye. Function \`groupBy(items, key)\` banao:

- \`items\`: objects ka array, jaise \`[{ "name": "Riya", "city": "Pune" }, ...]\`
- \`key\`: kis property se group karna hai, jaise \`"city"\`
- Return: ek object jiski har key ek group value hai aur value us group ke items ka **array** (original order mein).
- Agar kisi item mein woh key nahi hai (ya null hai), toh use \`"unknown"\` group mein daalo.

Example: \`groupBy([{name:"Riya",city:"Pune"},{name:"Aman",city:"Delhi"},{name:"Kabir",city:"Pune"}], "city")\`
→ \`{ "Pune": [Riya, Kabir], "Delhi": [Aman] }\``,
      functionName: "groupBy",
      starterJs: `function groupBy(items, key) {
  const groups = {};
  // fill groups
  return groups;
}`,
      starterPython: `def groupBy(items, key):
    groups = {}
    # fill groups
    return groups`,
      tests: [
        {
          name: "group by city",
          args: [[{ name: "Riya", city: "Pune" }, { name: "Aman", city: "Delhi" }, { name: "Kabir", city: "Pune" }], "city"],
          expected: { Pune: [{ name: "Riya", city: "Pune" }, { name: "Kabir", city: "Pune" }], Delhi: [{ name: "Aman", city: "Delhi" }] },
        },
        { name: "empty list", args: [[], "city"], expected: {} },
        {
          name: "single group",
          args: [[{ id: 1, type: "veg" }, { id: 2, type: "veg" }], "type"],
          expected: { veg: [{ id: 1, type: "veg" }, { id: 2, type: "veg" }] },
        },
        {
          name: "group by a different key",
          args: [[{ id: 1, status: "PAID" }, { id: 2, status: "PENDING" }, { id: 3, status: "PAID" }], "status"],
          expected: { PAID: [{ id: 1, status: "PAID" }, { id: 3, status: "PAID" }], PENDING: [{ id: 2, status: "PENDING" }] },
        },
        {
          name: "missing key goes to unknown",
          args: [[{ name: "Riya", city: "Pune" }, { name: "Zoya" }, { name: "Dev", city: null }], "city"],
          expected: { Pune: [{ name: "Riya", city: "Pune" }], unknown: [{ name: "Zoya" }, { name: "Dev", city: null }] },
          hidden: true,
        },
        {
          name: "order is preserved",
          args: [[{ n: 3, g: "a" }, { n: 1, g: "b" }, { n: 2, g: "a" }], "g"],
          expected: { a: [{ n: 3, g: "a" }, { n: 2, g: "a" }], b: [{ n: 1, g: "b" }] },
          hidden: true,
        },
      ],
      hints: [
        "Har item ke liye group ka naam = item[key] (ya 'unknown'). Object ko ek dictionary ki tarah use karo jahan key = group naam, value = array.",
        "Loop chalao. Agar groups[name] abhi exist nahi karta toh pehle khaali array banao, phir item push karo.",
        "const name = item[key] ?? 'unknown'; if (!groups[name]) groups[name] = []; groups[name].push(item);",
      ],
      explainQuestions: [
        { question: "Why did you use bracket notation instead of dot notation?", keywords: ["variable", "key", "bracket", "dynamic"] },
        { question: "How did you handle items where the key is missing or null?", keywords: ["unknown", "??", "null", "undefined"] },
        { question: "What is the time complexity of your solution and why?", keywords: ["o(n)", "single loop", "lookup"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "How are objects passed in JavaScript: by value or by reference?",
        short: "JavaScript is always pass-by-value, but for objects the value being copied is a reference. So a function receiving an object can mutate its properties and the caller sees the change, but reassigning the parameter to a new object does not affect the caller's variable.",
        deep: `\`\`\`js
function mutate(o) { o.x = 1; }      // caller sees x = 1
function reassign(o) { o = { x: 2 }; } // caller unaffected
\`\`\`
- This is often called "call by sharing".
- Primitives are copied, so they can never be changed through a parameter.
- To avoid surprises, copy before mutating (\`{ ...o }\`) or treat inputs as read-only.`,
        followUps: ["How would you prevent a function from mutating an object passed to it?", "What is the difference between Object.freeze and const?"],
        commonMistake: "Saying JS is pass-by-reference and expecting reassignment of a parameter to change the caller's variable.",
        keywords: ["pass by value", "reference", "mutate", "reassign", "call by sharing"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
      {
        question: "What is the difference between a shallow copy and a deep copy, and how do you make each?",
        short: "A shallow copy creates a new top-level object but nested objects are still shared by reference; spread and Object.assign make shallow copies. A deep copy duplicates every level, which you can do with structuredClone. JSON.parse(JSON.stringify(obj)) also works but loses dates, undefined, functions and Maps.",
        deep: `- Shallow: \`{ ...obj }\`, \`Object.assign({}, obj)\`, \`[...arr]\`.
- Deep: \`structuredClone(obj)\` (handles Dates, Maps, Sets, cycles; not functions or DOM nodes).
- JSON round-trip drops \`undefined\` and functions, turns Dates into strings and fails on cycles.
- In React, prefer targeted nested spreads or Immer over deep-cloning the whole state.`,
        followUps: ["What does structuredClone not support?", "Why is deep cloning state on every update a bad idea?"],
        commonMistake: "Assuming spread copies nested objects too.",
        keywords: ["shallow", "nested", "reference", "structuredclone", "json"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "SDE"],
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────────
  // 7. Closures
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "js-closures",
    estMinutes: 50,
    difficulty: 2,
    prerequisites: ["js-functions", "js-scope-hoisting"],
    objectives: [
      "Closure ki definition apne shabdon mein samjhana: function + uska lexical scope",
      "Closures se private state banana (counter, once, rate limiter)",
      "var + loop + setTimeout wala classic bug samajhna aur let se fix karna",
      "React jaise frameworks mein stale closure problem pehchanna",
    ],
    technicalDefinition:
      "A closure is the combination of a function and the lexical environment in which it was declared, allowing the function to access variables from its outer scope even after that outer function has finished executing.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Closure** tab banta hai jab ek function apne **bahar wale function ke variables ko yaad rakhta hai**, even jab bahar wala function kab ka khatam ho chuka ho.

\`\`\`js
function makeCounter() {
  let count = 0;            // bahar wala variable
  return () => ++count;     // andar wala function count ko yaad rakhta hai
}
const next = makeCounter(); // makeCounter khatam
next(); // 1
next(); // 2  -> count abhi bhi zinda hai!
\`\`\`

Normally function khatam hone pe uske local variables mit jaate hain. Lekin agar andar ka koi function bahar return ho gaya aur woh un variables ko use karta hai, toh JS unhe zinda rakhti hai. Function + uske yaad rakhe hue variables = **closure**.`,
          en: `A **closure** is created when a function **remembers variables from its outer function**, even after that outer function has finished.

In the example, \`makeCounter\` returns an arrow function that uses \`count\`. After \`makeCounter\` returns, \`count\` would normally disappear, but because the inner function still references it, JavaScript keeps it alive. Each call to \`next()\` increments the same remembered \`count\`.

Function + the variables it remembers = **closure**.`,
          hi: `**Closure** तब बनता है जब एक फ़ंक्शन अपने **बाहर वाले फ़ंक्शन के वेरिएबल याद रखता है**, भले ही बाहर वाला फ़ंक्शन कब का ख़त्म हो चुका हो।

ऊपर के उदाहरण में \`makeCounter\` एक अंदर का फ़ंक्शन लौटाता है जो \`count\` इस्तेमाल करता है। आम तौर पर फ़ंक्शन ख़त्म होने पर उसके लोकल वेरिएबल मिट जाते हैं, लेकिन यहाँ अंदर वाला फ़ंक्शन अभी भी \`count\` का इस्तेमाल करता है, इसलिए JavaScript उसे ज़िंदा रखती है। फ़ंक्शन और उसके याद रखे हुए वेरिएबल मिलकर **closure** कहलाते हैं।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Socho tum ghar se **hostel** ja rahe ho. Mummy ne ek **tiffin** pack karke diya jismein ghar ka achaar, ghee aur parathe hain.

Ab tum hostel mein ho (ghar wala "function" khatam ho chuka, tum wahan nahi ho), lekin tiffin khologe toh ghar ki cheezein abhi bhi milti hain. Tiffin = **closure**. Tum (andar wala function) ghar (bahar wala scope) se nikal aaye ho, phir bhi ghar ka saamaan saath hai.

Aur important baat: har bachche ko **apna alag tiffin** milta hai. Tumhara bhai bhi hostel gaya, uska tiffin alag hai. Yeh exactly \`makeCounter()\` do baar call karne jaisa hai: dono counters ka \`count\` alag-alag hai.

Aur koi bahar wala tumhare tiffin ka achaar seedha nahi nikaal sakta, sirf tum (andar ka function) access kar sakte ho. Isliye closures se **private data** banta hai.`,
          en: `You leave home for a **hostel** and your mother packs a **tiffin** with home food. At the hostel, home (the outer function) is far away, yet opening the tiffin still gives you home food. The tiffin is the **closure**: you left the outer scope but carried its things with you.

Each child gets their **own tiffin**; calling \`makeCounter()\` twice gives two independent counts. And nobody else can take food from your tiffin directly, only you can, which is how closures create **private data**.`,
          hi: `मान लीजिए आप घर से **हॉस्टल** जा रहे हैं। माँ ने एक **टिफ़िन** पैक करके दिया जिसमें घर का अचार और पराठे हैं।

अब आप हॉस्टल में हैं, घर वाला "फ़ंक्शन" ख़त्म हो चुका है, लेकिन टिफ़िन खोलने पर घर की चीज़ें अभी भी मिलती हैं। यही टिफ़िन **closure** है।

हर बच्चे को **अपना अलग टिफ़िन** मिलता है, ठीक वैसे ही जैसे \`makeCounter()\` को दो बार बुलाने पर दो अलग count बनते हैं। और कोई बाहर वाला आपके टिफ़िन से सीधे कुछ नहीं निकाल सकता, इसलिए closure से **प्राइवेट डेटा** बनता है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Closures JS ka design ka natural result hain (functions first-class hain aur scope lexical hai), lekin yeh bahut kaam ke hain:

- **Private state**: JS mein pehle \`private\` keyword nahi tha. Closure se aisa data banta hai jise bahar se koi seedha badal nahi sakta, sirf diye gaye functions se. Jaise bank balance jo sirf \`deposit\`/\`withdraw\` se badle.
- **Function factories**: \`makeMultiplier(3)\`, \`createLogger("payments")\` — ek function jo settings yaad rakh ke customised function banata hai.
- **Callbacks ko context yaad rehna**: \`setTimeout\`, event listeners, \`fetch().then()\` — callback baad mein chalta hai, lekin use apne time ke variables chahiye. Closure ke bina yeh possible hi nahi.
- **Utilities**: \`once\` (payment button double-click se do baar charge na ho), \`debounce\` (search box har keystroke pe API na maare), \`memoize\` (result cache).

Closures nahi samjhe toh React hooks, event handlers aur async code mein aane wale ajeeb bugs samajh nahi aayenge.`,
          en: `Closures follow naturally from first-class functions and lexical scope, and they are very useful:

- **Private state** that can only change through the functions you expose, like a balance changed only by deposit/withdraw.
- **Function factories** like \`makeMultiplier(3)\` or \`createLogger("payments")\`.
- **Callbacks remembering context** in \`setTimeout\`, event listeners and promises.
- **Utilities** like \`once\` (prevent double charges), \`debounce\` (search boxes) and \`memoize\` (caching).

Without understanding closures, bugs in React hooks, event handlers and async code are hard to explain.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **React (Facebook, Instagram, Swiggy web)**: \`useState\` aur \`useEffect\` closures pe hi bane hain. Har render ka event handler us render ki state ko "yaad" rakhta hai. Yahi "stale closure" bug ka source bhi hai.
- **Flipkart / Amazon search box**: \`debounce\` function closure mein ek \`timer\` variable rakhta hai. Har keystroke pe purana timer cancel, naya set; sirf jab tum 300ms ruko tab API call jaati hai. Server pe lakhon faltu requests bachti hain.
- **Payment gateways (Razorpay checkout)**: "Pay" button ko \`once\` jaise wrapper se protect karte hain: closure mein \`called = false\` flag, pehli click ke baad true, toh double-charge nahi.
- **Node.js / Express**: middleware factories jaise \`rateLimit({ max: 100 })\` ya \`requireRole("admin")\` options ko closure mein yaad rakh ke ek middleware function return karti hain.`,
          en: `- **React**: hooks rely on closures; each render's handlers remember that render's state, which also causes "stale closure" bugs.
- **Flipkart / Amazon search**: \`debounce\` keeps a \`timer\` in a closure so the API is called only after typing pauses.
- **Payment buttons**: a \`once\` wrapper keeps a \`called\` flag in a closure to prevent double charges.
- **Express**: middleware factories such as \`rateLimit({ max: 100 })\` or \`requireRole("admin")\` capture options in closures and return middleware.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Andar se closure kaise kaam karta hai:

1. Har function call pe ek **execution context** banta hai jismein ek **lexical environment** hota hai: local variables + ek pointer bahar wale environment ki taraf (**scope chain**).
2. Jab ek function *banaya* jaata hai (call nahi), tab woh apne current lexical environment ka reference apne saath chipka leta hai (spec mein \`[[Environment]]\` slot).
3. \`makeCounter()\` return hua: uska execution context call stack se pop ho gaya. Normally uska environment garbage collect ho jaata. Lekin returned function ka \`[[Environment]]\` abhi bhi us environment ko point kar raha hai, toh woh **heap pe zinda rehta hai**.
4. \`next()\` call karne pe \`count\` local mein nahi milta, toh scope chain se bahar wale environment mein milta hai, aur wahi update hota hai.

**Scope lexical hai**: kaun se variables dikhenge, yeh is baat se decide hota hai ki function **code mein kahan likha** gaya, na ki kahan se call hua. Closure value ka snapshot nahi, **variable ka live reference** rakhta hai.`,
          en: `1. Each call creates an execution context with a **lexical environment**: local variables plus a link to the outer environment (the **scope chain**).
2. When a function is **created**, it stores a reference to its current environment (\`[[Environment]]\`).
3. When \`makeCounter()\` returns, its context leaves the stack, but the environment stays on the heap because the returned function still references it.
4. Calling \`next()\` finds \`count\` through the scope chain and updates it.

Scope is **lexical**: it depends on where the function is written, not where it is called. A closure holds a **live reference** to variables, not a snapshot.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Teen closures ek saath:

- \`makeCounter\`: \`count\` private hai. \`c1\` aur \`c2\` alag calls se bane, toh unke counts alag (c1 = 2, c2 = 1).
- \`once\`: \`called\` aur \`result\` closure mein. Payment function pehli baar chalta hai, doosri baar purana result deta hai, dobara charge nahi.
- Loop: \`var\` ke saath saare functions ek hi \`i\` share karte hain (loop ke baad 3), toh output \`3,3,3\`. \`let\` har iteration mein naya \`i\` banata hai, toh \`0,1,2\`. Yahan functions array mein rakh ke baad mein call kiye, setTimeout jaisa hi effect.

Python mein bhi closures hain. Bahar wale variable ko badalna ho toh \`nonlocal\` likhna padta hai. Aur Python loops mein \`lambda\` late binding karta hai (JS var jaisa); default argument \`i=i\` se fix hota hai.`,
          en: `Three closures:
- \`makeCounter\` keeps \`count\` private; \`c1\` and \`c2\` have independent counts.
- \`once\` stores \`called\` and \`result\`, so the payment runs only once.
- The loop shows \`var\` sharing one \`i\` (prints 3,3,3) versus \`let\` creating a new binding each iteration (0,1,2).

Python closures need \`nonlocal\` to modify outer variables, and lambdas in loops bind late like \`var\`; a default argument \`i=i\` fixes it.`,
        },
        codeJs: `function makeCounter() {
  let count = 0;
  return () => ++count;
}
const c1 = makeCounter();
const c2 = makeCounter();
c1();
console.log("c1:", c1(), "c2:", c2());

function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}
const pay = once((amt) => "charged " + amt);
console.log(pay(499), "|", pay(499));

const withVar = [];
for (var i = 0; i < 3; i++) withVar.push(() => i);
const withLet = [];
for (let j = 0; j < 3; j++) withLet.push(() => j);
console.log("var:", withVar.map((f) => f()).join(","));
console.log("let:", withLet.map((f) => f()).join(","));`,
        codePython: `def make_counter():
    count = 0
    def nxt():
        nonlocal count
        count += 1
        return count
    return nxt

c1 = make_counter()
c2 = make_counter()
c1()
print("c1:", c1(), "c2:", c2())

def once(fn):
    called = False
    result = None
    def wrapper(*args):
        nonlocal called, result
        if not called:
            called = True
            result = fn(*args)
        return result
    return wrapper

pay = once(lambda amt: "charged " + str(amt))
print(pay(499), "|", pay(499))

late = [lambda: i for i in range(3)]
fixed = [lambda i=i: i for i in range(3)]
print("late:", ",".join(str(f()) for f in late))
print("fixed:", ",".join(str(f()) for f in fixed))`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `- **Closure ko value ka snapshot samajhna**: closure variable ka **live reference** rakhta hai. Variable baad mein badla toh closure ko nayi value dikhegi.
- **\`var\` + loop + callback**: \`for (var i...) setTimeout(() => console.log(i))\` sab mein last value. \`let\` use karo.
- **React stale closure**: \`useEffect(() => { setInterval(() => setCount(count + 1), 1000) }, [])\` — \`count\` hamesha 0 dikhta hai kyunki callback pehle render ka closure hai. Fix: \`setCount(c => c + 1)\` ya dependency array sahi karo.
- **Memory leak**: bada data (jaise 10MB array) closure mein pakda reh gaya aur function kisi global event listener mein laga hai, toh woh data kabhi free nahi hoga. Listener remove karo.
- **Har call pe naya closure samajhna same hai**: \`makeCounter()\` do baar call kiya toh do alag \`count\`. Shared counter chahiye toh ek hi instance use karo.
- **Python mein \`nonlocal\` bhoolna**: \`UnboundLocalError\` aata hai.`,
          en: `- Thinking a closure stores a snapshot; it holds a **live reference**.
- \`var\` in loops with callbacks gives the last value; use \`let\`.
- **React stale closures**: an interval created once keeps seeing the first render's \`count\`; use functional updates or correct dependencies.
- **Memory leaks**: large data captured by a closure attached to a long-lived listener is never freed.
- Expecting two \`makeCounter()\` calls to share state.
- Forgetting \`nonlocal\` in Python causes \`UnboundLocalError\`.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Closure bugs aise debug karo:

1. **DevTools Scope panel**: callback ke andar breakpoint lagao. Right side "Scope" mein **Local**, **Closure (makeCounter)** aur **Global** sections dikhte hain. Closure section mein exactly woh variables hain jo function ne pakde hain, unki current value ke saath.
2. **Galat/purani value aa rahi hai?** Socho: "yeh function **kab bana** tha, aur us waqt kaunsa variable scope mein tha?" Function call hone ka time nahi, banne ka time matter karta hai.
3. **Loop wala bug**: loop variable \`var\` hai? \`let\` karo. Ya value ko function argument se pass karo.
4. **React stale state**: ESLint ka \`react-hooks/exhaustive-deps\` rule on rakho, yeh missing dependencies batata hai. Callback mein \`console.log(count)\` karke dekho ki kaunse render ki value hai.
5. **Memory leak ka shaq**: Chrome DevTools → Memory → Heap snapshot lo, kuch actions karo, dobara snapshot lo, compare karo. "(closure)" entries badhti ja rahi hain toh listeners ya timers clear nahi ho rahe.`,
          en: `1. Pause inside the callback and inspect the **Closure** section of the DevTools Scope panel to see captured variables.
2. Stale value? Ask when the function was **created** and which variable was in scope then.
3. Loop bug? Switch \`var\` to \`let\` or pass the value as an argument.
4. React: enable \`react-hooks/exhaustive-deps\` and log state inside the callback.
5. Suspected leak: compare heap snapshots before and after actions; growing "(closure)" entries mean listeners or timers are not cleared.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Closure vs class private fields**: aaj JS mein \`#private\` fields hain: \`class Counter { #count = 0; }\`. Bahut saare methods aur inheritance chahiye toh class saaf hai. Chhote utilities (\`once\`, \`debounce\`, factory) ke liye closure halka aur simple.
- **Memory**: har closure apna environment zinda rakhta hai. Lakhon objects mein har ek ke liye alag closure methods banana memory zyada khaata hai; class methods prototype pe ek hi baar bante hain.
- **Readability**: 3-4 level nested closures (function returning function returning function) padhna mushkil hai. Naam do aur flat rakho.
- **Hidden state**: closure ka state bahar se dikhta nahi, testing aur debugging thodi mushkil. Zaroorat ho toh \`getState()\` jaisa method expose karo.
- **Module scope**: ES modules ka top-level variable bhi file ke functions ke liye private hai, toh kai baar alag closure ki zaroorat hi nahi.`,
          en: `- **Closures vs class \`#private\` fields**: classes suit many methods and inheritance; closures suit small utilities.
- **Memory**: each closure keeps its environment alive; class methods are shared on the prototype.
- **Readability** suffers with deeply nested function factories.
- **Hidden state** is harder to inspect and test; expose a getter if needed.
- ES module top-level variables are already private to the file, so an extra closure is sometimes unnecessary.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real e-commerce frontend mein search box ka \`debounce\` closure ka perfect example hai:

\`\`\`js
function debounce(fn, wait) {
  let timer;                         // closure mein private
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
const searchProducts = debounce((q) => api.search(q), 300);
input.addEventListener("input", (e) => searchProducts(e.target.value));
\`\`\`

User "iphone" type karta hai: 6 keystrokes, lekin API call sirf **ek**, aakhri keystroke ke 300ms baad. \`timer\` har call ke beech zinda rehta hai kyunki closure use pakde hue hai.

Backend pe Express mein \`requireRole("admin")\` jaisi middleware factory, aur React mein custom hooks (\`useDebounce\`) bhi isi pattern pe hain. Code review mein stale closures (hooks dependencies) aur clear na kiye gaye timers/listeners dhyan se dekhe jaate hain.`,
          en: `A search box \`debounce\` is a classic real-world closure: \`timer\` lives in the closure, each keystroke clears the old timer and sets a new one, so typing "iphone" (6 keystrokes) triggers only **one** API call 300ms after the last key.

Express middleware factories like \`requireRole("admin")\` and React custom hooks such as \`useDebounce\` use the same pattern. Reviewers watch for stale closures in hooks and timers or listeners that are never cleared.`,
        },
      },
    ],
    visualization: {
      kind: "STACK",
      title: "makeCounter: stack se gaya, closure zinda raha",
      steps: [
        { title: "makeCounter() call", description: "Call stack pe makeCounter ka context push hua. Uske environment mein count = 0 bana.", highlight: "count = 0" },
        { title: "Arrow function bana", description: "Andar ka () => ++count bana aur usne makeCounter ke environment ka reference apne saath chipka liya ([[Environment]]).", highlight: "() => ++count" },
        { title: "makeCounter return / pop", description: "makeCounter stack se pop ho gaya. Lekin uska environment heap pe zinda hai, kyunki next function use point kar raha hai.", highlight: "stack: [global]" },
        { title: "next() pehli baar", description: "next ka context stack pe aaya. count local mein nahi mila, scope chain se closure mein mila. count 0 → 1.", highlight: "count = 1" },
        { title: "next() doosri baar", description: "Same closure environment, count 1 → 2. Value yaad hai kyunki environment ek hi hai.", highlight: "count = 2" },
        { title: "makeCounter() dobara", description: "Naya call = naya environment, naya count = 0. Pehle counter pe koi asar nahi. Har closure ka apna tiffin!", highlight: "new count = 0" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which best describes a closure?",
        options: [
          "A function that closes the browser tab",
          "A function together with the variables from the scope where it was created",
          "A function that can only be called once",
          "A way to delete variables after use",
        ],
        correct: [1],
        explanation: "Closure = function + uske banne ki jagah wale scope ke variables. Function bahar jaake bhi un variables ko access kar sakta hai.",
        tags: ["definition"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Scope in JavaScript is lexical. What does that mean?",
        options: [
          "Variables available to a function depend on where it is called",
          "Variables available to a function depend on where it is written in the code",
          "All variables are global",
          "Scope is decided randomly at runtime",
        ],
        correct: [1],
        explanation: "Lexical = code mein likhne ki jagah. Function kahan **define** hua, wahi decide karta hai ki use kaunse variables dikhenge, chahe use kahin se bhi call karo.",
        tags: ["lexical-scope"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Why does a closure-based `count` survive after `makeCounter()` returns?",
        options: [
          "Because count is a global variable",
          "Because the returned function still references makeCounter's environment, so it is not garbage collected",
          "Because let variables are never deleted",
          "Because JavaScript copies count into the returned function as a constant",
        ],
        correct: [1],
        explanation: "Jab tak koi function us environment ko reference kar raha hai, garbage collector use free nahi karta. Copy nahi hota, live variable hai, isliye ++count har baar badhta hai.",
        tags: ["internals"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these commonly rely on closures? (Select all that apply)",
        options: ["debounce for a search box", "A once() wrapper for a pay button", "Math.max(1, 2)", "React event handlers reading state", "JSON.parse(text)"],
        correct: [0, 1, 3],
        explanation: "debounce timer ko, once flag ko, aur React handlers render ki state ko closure mein yaad rakhte hain. Math.max aur JSON.parse simple functions hain, koi state yaad nahi rakhte.",
        tags: ["usage"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 3,
        prompt: "What does this code print?",
        code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
        codeLanguage: "javascript",
        options: ["0\n1\n2", "3\n3\n3", "2\n2\n2", "undefined\nundefined\nundefined"],
        correct: [1],
        explanation: "`var i` poore function/script mein ek hi variable hai. Callbacks loop khatam hone ke baad chalte hain, jab i = 3 ho chuka. Teeno callbacks same `i` dekhte hain, toh 3 3 3. `let` hota toh har iteration ka apna i: 0 1 2.",
        tags: ["loop-closure"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `function makeCounter() {
  let count = 0;
  return () => ++count;
}
const c1 = makeCounter();
const c2 = makeCounter();
c1();
c1();
console.log(c1(), c2());`,
        codeLanguage: "javascript",
        options: ["3 1", "3 4", "1 1", "2 1"],
        correct: [0],
        explanation: "c1 aur c2 alag calls se bane, toh dono ka apna `count`. c1 teen baar chala (3), c2 pehli baar (1).",
        tags: ["private-state"],
      },
      {
        type: "SCENARIO",
        difficulty: 3,
        prompt: "In a React component, `useEffect(() => { const id = setInterval(() => setSeconds(seconds + 1), 1000); return () => clearInterval(id); }, []);` makes the timer stop at 1. What is the root cause?",
        options: [
          "setInterval does not work inside React",
          "The interval callback closes over the seconds value from the first render, which is always 0",
          "clearInterval runs every second",
          "seconds should be declared with var",
        ],
        correct: [1],
        explanation: "Empty dependency array ki wajah se effect sirf pehle render pe chala. Interval callback us render ka closure hai jahan `seconds = 0`, toh har baar 0 + 1 = 1 set hota hai. Fix: `setSeconds(s => s + 1)`.",
        tags: ["stale-closure", "react"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps when `const next = makeCounter(); next();` runs.",
        options: [
          "makeCounter is called and count = 0 is created in its environment",
          "The inner function is created and captures that environment",
          "makeCounter returns the inner function and its frame is popped",
          "next() is called and looks up count through the scope chain",
          "count is incremented to 1 in the captured environment",
        ],
        explanation: "Outer call → variable bana → inner function bana aur environment pakda → outer return/pop → inner call → scope chain se count mila aur update hua.",
        tags: ["internals"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain how a closure can be used to create private data that cannot be changed directly from outside. Give a small example idea.",
        keywords: ["outer function", "inner function", "not accessible", "scope", "return"],
        explanation: "Variable ko outer function ke andar banao aur sirf woh inner functions return karo jo use padhte/badalte hain (jaise deposit/getBalance). Bahar se variable ka naam scope mein hi nahi hai, toh seedha change nahi ho sakta; sirf exposed functions se.",
        tags: ["private-state"],
      },
    ],
    buildTask: {
      title: "Closure-based counter machine",
      description: `Ek function \`runCounter(ops)\` banao jo **andar ek closure-based counter** banaye aur commands chalaye.

Andar ye helper banao:
\`\`\`
makeCounter() -> { inc, dec, reset, get }   // count closure mein private
\`\`\`

Rules:
- \`"inc"\` → count + 1
- \`"dec"\` → count - 1, lekin count **0 se neeche nahi** jaata
- \`"reset"\` → count = 0
- \`"get"\` → current count ko result array mein daalo
- Koi aur command → ignore

Return: har \`"get"\` pe mili values ka array.

Example: \`runCounter(["inc", "inc", "get", "dec", "get"])\` → \`[2, 1]\``,
      functionName: "runCounter",
      starterJs: `function runCounter(ops) {
  function makeCounter() {
    let count = 0;
    // return an object with inc, dec, reset, get
  }
  const results = [];
  // create a counter and run every op
  return results;
}`,
      starterPython: `def runCounter(ops):
    def make_counter():
        count = 0
        # define inc, dec, reset, get using nonlocal
        # and return them (e.g. in a dict)
    results = []
    # create a counter and run every op
    return results`,
      tests: [
        { name: "two incs", args: [["inc", "inc", "get"]], expected: [2] },
        { name: "multiple gets", args: [["inc", "get", "inc", "get"]], expected: [1, 2] },
        { name: "no ops", args: [[]], expected: [] },
        { name: "dec never below zero", args: [["dec", "get"]], expected: [0] },
        { name: "reset", args: [["inc", "inc", "reset", "inc", "get"]], expected: [1], hidden: true },
        { name: "unknown ops ignored", args: [["get", "inc", "inc", "inc", "dec", "get", "jump", "get"]], expected: [0, 2, 2], hidden: true },
      ],
      hints: [
        "count ko makeCounter ke andar let se banao. Jo functions return karoge (inc, dec, reset, get) woh sab isi count ko closure se dekhenge.",
        "makeCounter ek object return kare: { inc() {...}, dec() {...}, reset() {...}, get() { return count; } }. Phir ops pe loop chala ke sahi function call karo.",
        "dec: () => { if (count > 0) count--; }  ...  for (const op of ops) { if (op === 'get') results.push(counter.get()); else if (op === 'inc') counter.inc(); ... }",
      ],
      explainQuestions: [
        { question: "Where does the count variable live, and why can't code outside makeCounter change it directly?", keywords: ["closure", "private", "scope", "makecounter"] },
        { question: "Why do inc, dec and get all see the same count?", keywords: ["same environment", "shared", "closure", "reference"] },
        { question: "What would change if you called makeCounter() again inside the loop for each op?", keywords: ["new counter", "reset", "new environment", "zero"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "What is a closure in JavaScript? Give a practical example.",
        short: "A closure is a function bundled with the lexical environment it was created in, so it can access outer variables even after the outer function has returned. A practical example is a debounce utility: it keeps a timer variable in a closure so each call can cancel the previous timer, letting a search box hit the API only after the user stops typing.",
        deep: `\`\`\`js
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
\`\`\`
- Closures capture **variables, not values**; they see later updates.
- Every call to the outer function creates a fresh environment.
- Uses: data privacy, function factories, memoization, once/debounce/throttle, module pattern, React hooks.
- Risks: memory retention when closures are attached to long-lived listeners; stale values in React effects.`,
        followUps: [
          "Why does a for loop with var and setTimeout print the same number?",
          "How can closures cause memory leaks?",
          "What is a stale closure in React and how do you fix it?",
        ],
        commonMistake: "Defining a closure as 'a function inside a function' without mentioning that it retains access to the outer scope after the outer function returns.",
        keywords: ["lexical environment", "outer scope", "after return", "debounce", "private state"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
      {
        question: "Why does `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))` print 3, 3, 3, and how do you fix it?",
        short: "var is function-scoped, so there is only one i shared by all three callbacks. The callbacks run after the loop finishes, when i is already 3. Using let fixes it because let creates a new binding of i for each iteration, so each callback closes over its own value: 0, 1, 2.",
        deep: `- Callbacks run later from the macrotask queue, after the synchronous loop.
- Fixes: \`let\`; pass \`i\` as the third argument of \`setTimeout\`; or wrap in an IIFE \`(function (j) { ... })(i)\`, the pre-ES6 approach.
- Same idea appears in Python as late binding of lambdas in loops.`,
        followUps: ["How did developers fix this before let existed?", "What is the event loop's role in this output?"],
        commonMistake: "Saying setTimeout with 0 delay runs immediately inside the loop.",
        keywords: ["function scope", "block scope", "shared variable", "new binding", "event loop"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "SDE"],
      },
    ],
    promptCard: {
      title: "Debug a stale closure",
      category: "DEBUGGING",
      task: "Find out which variable a callback has captured and why it shows an old value, then get a minimal fix.",
      whenToUse: "Jab callback, setInterval, event listener ya React hook mein value purani (stale) dikh rahi ho, ya loop ke callbacks sab same value print kar rahe hon.",
      template: `I have a JavaScript closure bug.

Code:
\`\`\`js
[PASTE_CODE]
\`\`\`

Expected behaviour: [EXPECTED_BEHAVIOUR]
Actual behaviour: [ACTUAL_BEHAVIOUR]
Environment: [ENVIRONMENT]

Please:
1. Identify the exact function (callback/handler) that has the stale or shared value.
2. Explain WHEN that function was created and which variable binding it captured.
3. Explain step by step why it sees the value it sees (mention var vs let, render cycles, or dependency arrays if relevant).
4. Give the smallest fix and explain why it works.
5. Give one way I can confirm the fix (a log line or DevTools Scope panel check).
Keep the explanation simple, like for a second-year student.`,
      variables: [
        { key: "PASTE_CODE", label: "The code with the bug" },
        { key: "EXPECTED_BEHAVIOUR", label: "What you expected" },
        { key: "ACTUAL_BEHAVIOUR", label: "What actually happens" },
        { key: "ENVIRONMENT", label: "Browser / Node / React version" },
      ],
      whyItWorks: [
        { part: "When was the function created", why: "Closure bugs creation time se samajh aate hain, call time se nahi. Yeh sawaal AI ko sahi direction mein sochne pe majboor karta hai." },
        { part: "Expected vs actual", why: "Dono dene se AI exact gap pe focus karta hai, generic closure lecture nahi deta." },
        { part: "Smallest fix + confirm step", why: "Chhota fix review karna aasaan hai, aur verify step se tum khud check kar sakte ho ki AI sahi hai." },
      ],
      verifyChecklist: [
        "Fix lagane ke baad code chala ke expected output confirm karo.",
        "DevTools Scope panel mein Closure section dekho ki ab sahi variable captured hai.",
        "React mein ESLint exhaustive-deps warning check karo ki fix ne nayi warning na di ho.",
      ],
      sampleOutput: `The stale function is the setInterval callback created in the first render.
It captured seconds = 0 because the effect has [] dependencies and never re-runs.
Each tick computes 0 + 1, so the UI stays at 1.
Fix: setSeconds(s => s + 1) — the updater receives the latest value instead of the captured one.
Confirm: log inside the updater; values should increase 1, 2, 3...`,
    },
  },
  // ───────────────────────────────────────────────────────────────────────────
  // 8. Promises
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "js-promises",
    estMinutes: 55,
    difficulty: 2,
    prerequisites: ["js-functions", "js-closures"],
    objectives: [
      "Promise ke teen states (pending, fulfilled, rejected) samajhna",
      ".then, .catch aur .finally se result aur errors handle karna",
      "Promises ko chain karna aur value aage pass karna",
      "Promise.all, allSettled, race aur any mein se sahi choose karna",
    ],
    technicalDefinition:
      "A Promise is an object representing the eventual completion or failure of an asynchronous operation, which settles exactly once into a fulfilled state with a value or a rejected state with a reason, and lets callbacks be attached via then, catch and finally.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Promise** ek object hai jo kehta hai: "Abhi result nahi hai, lekin **baad mein** ya toh value dunga, ya error batauga."

Promise ke teen states hote hain:
- **pending**: kaam chal raha hai (data aa raha hai).
- **fulfilled**: kaam ho gaya, value mil gayi.
- **rejected**: kaam fail hua, error (reason) mila.

Ek baar fulfilled ya rejected (yaani **settled**) ho gaya toh state kabhi nahi badalta.

Result lene ke liye callbacks lagate ho: \`.then(value => ...)\` success pe, \`.catch(err => ...)\` error pe, aur \`.finally(() => ...)\` dono case mein (jaise loader band karna). \`fetch\`, database queries, file reading — Node aur browser ki zyada tar async APIs promise hi return karti hain.`,
          en: `A **Promise** is an object saying: "I do not have the result yet, but **later** I will give you a value or an error."

It has three states: **pending** (work in progress), **fulfilled** (value available) and **rejected** (failed with a reason). Once **settled**, it never changes state.

You attach callbacks: \`.then(value => ...)\` for success, \`.catch(err => ...)\` for errors and \`.finally(() => ...)\` for both (like hiding a loader). \`fetch\`, database queries and file reads in modern APIs all return promises.`,
          hi: `**Promise** एक object है जो कहता है: "अभी नतीजा नहीं है, लेकिन **बाद में** या तो वैल्यू दूँगा या बताऊँगा कि गड़बड़ हुई।"

Promise की तीन अवस्थाएँ होती हैं: **pending** (काम चल रहा है), **fulfilled** (काम हो गया, वैल्यू मिल गई) और **rejected** (काम विफल हुआ, error मिला)। एक बार settled होने के बाद अवस्था कभी नहीं बदलती।

नतीजा लेने के लिए \`.then\` (सफलता पर), \`.catch\` (error पर) और \`.finally\` (दोनों स्थितियों में) लगाए जाते हैं। fetch, database query और file पढ़ने जैसी ज़्यादातर async API promise ही लौटाती हैं।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Zomato pe order** karte ho toh khana turant nahi milta. App tumhe ek **order ID aur tracking screen** deta hai. Yeh tracking screen hi **promise** hai:

- **Pending**: "Restaurant is preparing your food". Tum wait karte hue baaki kaam kar sakte ho (Instagram scroll), app hang nahi hota.
- **Fulfilled**: "Order delivered!" Khana (value) mil gaya. Ab \`.then(khana => khao())\`.
- **Rejected**: "Restaurant cancelled your order". Error (reason) mila. Ab \`.catch(err => refundLo())\`.
- **Finally**: chahe deliver ho ya cancel, tracking screen band ho jaati hai.

Aur ek baar "Delivered" ho gaya toh woh wapas "Preparing" nahi hota: promise ek hi baar settle hota hai.

**Promise.all** aisa hai jaise poore hostel floor ka group order: sab ka khana aaye tabhi party shuru; ek bhi cancel hua toh poora plan fail. **Promise.race**: jo pehle aaye (Swiggy ya Zomato), wahi khao.`,
          en: `Ordering on a food app, you do not get food instantly; you get an **order ID and a tracking screen**. That screen is the **promise**:

- **Pending**: "Preparing your food"; you can do other things meanwhile.
- **Fulfilled**: "Delivered!"; you get the value, \`.then(eat)\`.
- **Rejected**: "Restaurant cancelled"; you get a reason, \`.catch(getRefund)\`.
- **Finally**: either way, the tracking screen closes.

Once delivered it never goes back to preparing. **Promise.all** is a group order: the party starts only when everyone's food arrives, and one cancellation fails the plan. **Promise.race**: eat whichever arrives first.`,
          hi: `**Zomato पर ऑर्डर** करने पर खाना तुरंत नहीं मिलता। ऐप आपको एक **ऑर्डर ID और ट्रैकिंग स्क्रीन** देता है। यही ट्रैकिंग स्क्रीन **promise** है:

- **Pending**: "खाना बन रहा है"। इस बीच आप दूसरे काम कर सकते हैं।
- **Fulfilled**: "ऑर्डर डिलीवर हो गया!" खाना (वैल्यू) मिल गया।
- **Rejected**: "रेस्टोरेंट ने ऑर्डर कैंसल किया"। Error मिला, अब रिफ़ंड लो।
- **Finally**: डिलीवर हो या कैंसल, ट्रैकिंग स्क्रीन बंद हो जाती है।

एक बार "डिलीवर" होने के बाद वह वापस "बन रहा है" नहीं होता। **Promise.all** पूरे हॉस्टल का ग्रुप ऑर्डर है: सबका खाना आए तभी पार्टी, एक भी कैंसल तो पूरा प्लान फ़ेल।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `JavaScript **single-threaded** hai: ek time pe ek hi kaam. Agar network call (jo 500ms le sakti hai) ka wait karte hue JS ruk jaaye, toh poora page freeze: button click nahi, scroll nahi.

Isliye slow kaam (network, timer, file) **async** hote hain: shuru karo, aur result aane pe callback chalao. Pehle yeh sirf callbacks se hota tha, aur nested callbacks ka "**callback hell**" ban jaata tha:

\`\`\`js
getUser(id, (user) => {
  getOrders(user, (orders) => {
    getInvoice(orders[0], (inv) => { /* aur andar... */ });
  });
});
\`\`\`

Har level pe alag error handling, padhna mushkil. **Promises** ne yeh solve kiya:
- **Flat chain**: \`getUser().then(getOrders).then(getInvoice)\`.
- **Ek jagah error handling**: chain ke end mein ek \`.catch\`.
- **Combine karna aasaan**: \`Promise.all\` se parallel kaam.
- **Guarantee**: callback sirf ek baar chalega, aur settle hone ke baad lagaya gaya \`.then\` bhi chalega.`,
          en: `JavaScript is **single-threaded**. Waiting synchronously for a 500ms network call would freeze the page, so slow work is **async**: start it and run a callback when the result arrives.

Plain callbacks led to nested "**callback hell**" with error handling at every level. **Promises** fix this with:
- **Flat chains**: \`getUser().then(getOrders).then(getInvoice)\`.
- **One \`.catch\`** for the whole chain.
- **Easy combination** with \`Promise.all\`.
- **Guarantees**: callbacks run at most once, even if attached after settling.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Swiggy / Zomato home page**: banners, restaurants list aur user ka address teen alag APIs se aate hain. \`Promise.all([getBanners(), getRestaurants(), getAddress()])\` se teeno **parallel** mangaye jaate hain, sequential se kahin fast.
- **Razorpay / payment flows**: \`razorpay.payments.fetch(id)\` jaisi Node SDK calls promise return karti hain. \`.catch\` mein failed payment ko log karke user ko retry option dikhaya jaata hai.
- **Netflix / Hotstar**: video player kai CDNs se sabse fast response ke liye \`Promise.any\` / race jaisa logic use kar sakta hai, aur timeout ke liye \`Promise.race([fetchData(), timeout(5000)])\`.
- **Dashboards (admin panels)**: \`Promise.allSettled\` jab 5 widgets load karne hain aur ek widget fail ho toh baaki 4 phir bhi dikhne chahiye.

Browser ka \`fetch\`, Node ka \`fs/promises\`, Prisma/Mongoose queries — sab promises hi return karte hain.`,
          en: `- **Swiggy / Zomato home**: banners, restaurants and address load in **parallel** with \`Promise.all\`.
- **Payment SDKs (Razorpay)**: calls return promises; \`.catch\` logs failures and shows a retry option.
- **Streaming apps**: \`Promise.race([fetchData(), timeout(5000)])\` adds timeouts; \`Promise.any\` can pick the fastest CDN.
- **Admin dashboards**: \`Promise.allSettled\` keeps four widgets working when one fails.

\`fetch\`, Node's \`fs/promises\`, Prisma and Mongoose all return promises.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Promise andar se kaise chalta hai:

1. \`new Promise((resolve, reject) => {...})\`: **executor** function **turant, synchronously** chalta hai. Andar async kaam shuru hota hai (jaise timer).
2. Promise object ke andar internal fields hain: \`[[PromiseState]]\` (pending/fulfilled/rejected), \`[[PromiseResult]]\`, aur callbacks ki list.
3. \`.then(cb)\` lagane pe cb list mein register hota hai, aur \`.then\` **ek naya promise return** karta hai. Isi se chaining banti hai: cb jo return kare, woh naye promise ki value ban jaati hai; cb throw kare toh naya promise reject.
4. Jab \`resolve(value)\` call hota hai, state fulfilled hoti hai aur registered callbacks **microtask queue** mein daal diye jaate hain. Woh tab chalte hain jab current synchronous code khatam ho jaaye, isliye \`.then\` kabhi bhi turant (same line pe) nahi chalta.
5. Rejection chain mein neeche girta jaata hai jab tak koi \`.catch\` (ya \`.then\` ka second argument) na mile. Koi nahi mila toh "**UnhandledPromiseRejection**" warning/crash (Node mein process exit).`,
          en: `1. The executor in \`new Promise((resolve, reject) => ...)\` runs **synchronously**.
2. Internally a promise holds a state, a result and a list of reactions.
3. \`.then(cb)\` registers cb and **returns a new promise**; cb's return value fulfils it, a throw rejects it. That is chaining.
4. On \`resolve\`, reactions go into the **microtask queue** and run after the current synchronous code, so \`.then\` never runs immediately.
5. Rejections propagate down the chain until a \`.catch\`; if none, Node reports an unhandled rejection and may exit.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Code ek fake order API banata hai (network nahi, sirf \`setTimeout\` se delay):

- \`placeOrder(item, ms, fail)\`: promise return karta hai. \`ms\` baad ya toh \`resolve\` (order ID) ya \`reject\` (Error).
- Pehla chain: \`.then\` ne result liya aur nayi value return ki, agle \`.then\` ko mili. \`.finally\` hamesha chala.
- \`Promise.all\`: do orders parallel; dono ~40ms mein aaye, total time ~40ms, 80 nahi. Result order **input ke order** mein hai.
- \`Promise.allSettled\`: ek fail hone pe bhi sabka status mila.
- Last mein ek failing order \`.catch\` mein pakda gaya.

"sync line" sabse pehle print hoti hai, kyunki promises ke callbacks hamesha baad mein chalte hain. Python mein yeh kaam \`asyncio\` karta hai: \`async def\` + \`await asyncio.sleep\`, \`asyncio.gather\` = \`Promise.all\`, aur \`return_exceptions=True\` allSettled jaisa.`,
          en: `The code fakes an order API with \`setTimeout\` (no network). \`placeOrder\` returns a promise that resolves with an ID or rejects with an Error. The first chain shows values passing through \`.then\` and \`.finally\` always running. \`Promise.all\` runs two orders in parallel and keeps input order; \`allSettled\` reports every outcome; a failing order is caught by \`.catch\`. "sync line" prints first because promise callbacks always run later.

Python's \`asyncio\` equivalents: \`asyncio.gather\` for \`Promise.all\`, with \`return_exceptions=True\` behaving like \`allSettled\`.`,
        },
        codeJs: `function placeOrder(item, ms, fail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) reject(new Error(item + " out of stock"));
      else resolve("ORD-" + item.toUpperCase());
    }, ms);
  });
}

placeOrder("dosa", 20)
  .then((id) => {
    console.log("placed", id);
    return id + "-PAID";
  })
  .then((status) => console.log("status", status))
  .finally(() => console.log("loader hidden"))
  .then(() => Promise.all([placeOrder("chai", 40), placeOrder("samosa", 30)]))
  .then((ids) => {
    console.log("all:", ids);
    return Promise.allSettled([placeOrder("idli", 10), placeOrder("vada", 10, true)]);
  })
  .then((results) => {
    console.log("settled:", results.map((r) => r.status).join(","));
    return placeOrder("pizza", 10, true);
  })
  .catch((err) => console.log("caught:", err.message));

console.log("sync line");`,
        codePython: `import asyncio

async def place_order(item, ms, fail=False):
    await asyncio.sleep(ms / 1000)
    if fail:
        raise ValueError(item + " out of stock")
    return "ORD-" + item.upper()

async def main():
    try:
        oid = await place_order("dosa", 20)
        print("placed", oid)
        print("status", oid + "-PAID")
    finally:
        print("loader hidden")

    ids = await asyncio.gather(place_order("chai", 40), place_order("samosa", 30))
    print("all:", ids)

    results = await asyncio.gather(
        place_order("idli", 10), place_order("vada", 10, True), return_exceptions=True
    )
    print("settled:", ",".join("rejected" if isinstance(r, Exception) else "fulfilled" for r in results))

    try:
        await place_order("pizza", 10, True)
    except ValueError as err:
        print("caught:", err)

print("sync line")
asyncio.run(main())`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `- **\`.then\` ke andar \`return\` bhoolna**: \`.then(id => { fetchDetails(id) })\` — agla \`.then\` wait nahi karega aur \`undefined\` milega. Promise return karo.
- **Promise ke andar promise nest karna** (callback hell wapas): \`.then(a => b().then(c => ...))\`. Flat chain rakho.
- **\`.catch\` bhool jaana**: unhandled rejection; Node mein process crash ho sakta hai.
- **Promise ko value samajhna**: \`const user = fetchUser(); console.log(user.name)\` — \`user\` ek promise hai, naam nahi.
- **Sequential jab parallel ho sakta tha**: teen independent API calls ek ke baad ek chalana, 3x slow. \`Promise.all\` lo.
- **\`Promise.all\` jab partial success chahiye**: ek fail hua toh poora reject. Dashboard widgets ke liye \`allSettled\`.
- **Executor mein throw na karke reject bhool jaana**: \`setTimeout\` ke andar throw karne se promise reject nahi hota, uncaught error aata hai. Andar \`reject(err)\` call karo.`,
          en: `- Forgetting to \`return\` inside \`.then\`, so the chain does not wait.
- Nesting promises instead of chaining.
- Missing \`.catch\`, causing unhandled rejections.
- Treating a promise as its value.
- Running independent calls sequentially; use \`Promise.all\`.
- Using \`Promise.all\` when partial success is fine; use \`allSettled\`.
- Throwing inside a \`setTimeout\` in the executor instead of calling \`reject\`.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Promise bugs debug karna:

1. **"Promise { <pending> }" print ho raha hai?** Tum promise ko log kar rahe ho, value ko nahi. \`.then(v => console.log(v))\` ya \`await\` use karo.
2. **Har step pe log**: chain mein \`.then(x => { console.log("step2", x); return x; })\` daalo. Pata chalega kis step pe value \`undefined\` hui (aksar missing return).
3. **Unhandled rejection**: Node mein \`process.on("unhandledRejection", (r) => console.error(r))\` lagao; browser mein console mein "Uncaught (in promise)" dhundho. Stack trace dekho ki kaunsa promise bina catch ke tha.
4. **DevTools async stack traces**: Chrome by default async call stacks dikhata hai; breakpoint pe "Call Stack" mein \`await\`/\`Promise.then\` ke parts dikhte hain.
5. **Hang ho gaya (kabhi resolve nahi hua)?** Executor mein kisi branch mein \`resolve/reject\` call hi nahi ho raha. Timeout ke saath \`Promise.race\` lagao taaki pata chale.
6. **Network tab**: real APIs ke liye dekho ki request gayi bhi ya nahi, aur status kya aaya.`,
          en: `1. Seeing \`Promise { <pending> }\`? You logged the promise; use \`.then\` or \`await\`.
2. Log and return at each \`.then\` to find where a value becomes \`undefined\`.
3. Catch unhandled rejections with \`process.on("unhandledRejection")\` in Node or look for "Uncaught (in promise)" in the browser.
4. Use DevTools async stack traces at breakpoints.
5. Promise never settles? Some executor branch never calls resolve/reject; add a timeout with \`Promise.race\`.
6. Check the Network tab for real requests.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **\`.then\` chains vs \`async/await\`**: async/await (agla topic) zyada readable hai aur try/catch se errors. Lekin dono same promises pe chalte hain; library code, simple one-liners aur \`Promise.all\` ke saath \`.then\` abhi bhi common hai.
- **Promise.all vs allSettled**: all = "sab chahiye, ek fail toh sab fail" (checkout: price + stock + address). allSettled = "jitna mila utna dikhao" (dashboard).
- **race vs any**: race = jo pehle **settle** ho (reject bhi), timeouts ke liye. any = jo pehle **fulfil** ho, sab reject hon tabhi reject; fastest mirror/CDN ke liye.
- **Promises vs callbacks**: Node ke purane APIs callbacks use karte hain; \`util.promisify\` se promise bana lo.
- **Promises vs streams/observables**: promise **ek** value deta hai. Live cricket score jaise continuous data ke liye WebSockets, streams ya RxJS observables better.
- **Cancel nahi hota**: promise ko beech mein cancel nahi kar sakte; \`fetch\` ke liye \`AbortController\` lagta hai.`,
          en: `- **\`.then\` vs async/await**: same promises underneath; async/await reads better, \`.then\` suits short chains.
- **all vs allSettled**: all-or-nothing (checkout) vs partial results (dashboards).
- **race vs any**: race settles with the first settled (good for timeouts); any waits for the first fulfilment.
- Wrap old callback APIs with \`util.promisify\`.
- A promise yields **one** value; use streams or WebSockets for continuous data.
- Promises cannot be cancelled; use \`AbortController\` with \`fetch\`.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real food-delivery checkout page pe teen independent checks parallel chalte hain aur ek timeout bhi hota hai:

\`\`\`js
const timeout = (ms) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms));

Promise.race([
  Promise.all([checkStock(cartId), getDeliveryEta(addrId), validateCoupon(code)]),
  timeout(5000),
])
  .then(([stock, eta, coupon]) => renderCheckout({ stock, eta, coupon }))
  .catch((err) => showToast(err.message === "TIMEOUT" ? "Network slow hai" : "Kuch gadbad hui"))
  .finally(() => hideLoader());
\`\`\`

Teeno calls saath mein (parallel), 5 second ka timeout, ek jagah error handling, aur loader har haal mein band.

Backend pe Node.js mein global \`unhandledRejection\` handler logging (Sentry) ke liye lagaya jaata hai. Code review mein dekha jaata hai: missing \`.catch\`, missing \`return\`, aur bina wajah sequential calls.`,
          en: `On a real checkout page, three independent checks run in parallel with \`Promise.all\`, wrapped in \`Promise.race\` with a 5-second timeout. One \`.catch\` shows a friendly toast (slow network vs other errors) and \`.finally\` always hides the loader.

Node backends add a global \`unhandledRejection\` handler that reports to tools like Sentry. Reviewers look for missing \`.catch\`, missing \`return\` in \`.then\`, and needlessly sequential calls.`,
        },
      },
    ],
    visualization: {
      kind: "TIMELINE",
      title: "Promise ki life: pending se settled tak",
      steps: [
        { title: "t = 0ms: promise bana", description: "placeOrder('dosa', 20) call hua. Executor turant chala, setTimeout register hua. Promise state = pending.", highlight: "pending" },
        { title: "t = 0ms: .then register", description: ".then(cb) lagaya. cb abhi chala nahi, sirf promise ki callback list mein gaya. .then ne ek naya promise return kiya.", highlight: ".then(cb)" },
        { title: "t = 0ms: sync code khatam", description: "console.log('sync line') pehle print hua. Call stack khaali.", highlight: "sync line" },
        { title: "t = 20ms: resolve('ORD-DOSA')", description: "Timer complete, resolve call hua. State = fulfilled, value = 'ORD-DOSA'. cb microtask queue mein gaya.", highlight: "fulfilled" },
        { title: "Microtask: cb chala", description: "cb ne 'placed ORD-DOSA' print kiya aur 'ORD-DOSA-PAID' return kiya, jo next promise ki value bani.", highlight: "return id + '-PAID'" },
        { title: "Chain aage", description: "Agla .then us value ke saath chala. Kisi step pe error aata toh seedha neeche ke .catch tak skip karta.", highlight: ".then → .catch" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which of these is NOT a state of a Promise?",
        options: ["pending", "fulfilled", "rejected", "cancelled"],
        correct: [3],
        explanation: "Promise ke sirf teen states hain: pending, fulfilled, rejected. Native promises ko cancel nahi kar sakte; fetch ke liye AbortController alag cheez hai.",
        tags: ["states"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "What does `.then()` return?",
        options: ["The value passed to the callback", "undefined", "A new Promise", "The same Promise it was called on"],
        correct: [2],
        explanation: "`.then` hamesha ek **naya** promise return karta hai jo callback ke return value se resolve hota hai. Isi wajah se `.then().then()` chaining possible hai.",
        tags: ["chaining"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "You load 5 independent dashboard widgets and want to show whichever succeed, even if some fail. Which method fits best?",
        options: ["Promise.all", "Promise.allSettled", "Promise.race", "Promise.resolve"],
        correct: [1],
        explanation: "`allSettled` sabke settle hone ka wait karta hai aur har ek ka status deta hai, fail hone pe reject nahi karta. `Promise.all` ek bhi fail hone pe poora reject kar deta.",
        tags: ["combinators"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which statements about Promises are true? (Select all that apply)",
        options: [
          "The executor function passed to new Promise runs synchronously",
          "A settled promise can change from fulfilled to rejected later",
          "then callbacks run asynchronously, after the current synchronous code",
          "An error thrown inside a then callback rejects the promise returned by that then",
        ],
        correct: [0, 2, 3],
        explanation: "Executor turant chalta hai; then callbacks microtask queue se baad mein chalte hain; then ke andar throw = agla promise reject. Lekin settle hone ke baad state kabhi nahi badalti.",
        tags: ["internals"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `console.log("A");
Promise.resolve().then(() => console.log("B"));
console.log("C");`,
        codeLanguage: "javascript",
        options: ["A\nB\nC", "A\nC\nB", "B\nA\nC", "C\nA\nB"],
        correct: [1],
        explanation: "Promise already resolved hai, phir bhi `.then` ka callback microtask queue mein jaata hai aur sync code (A, C) khatam hone ke baad chalta hai. Isliye A, C, B.",
        tags: ["microtask"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 3,
        prompt: "What does this code print?",
        code: `Promise.resolve(1)
  .then((x) => x + 1)
  .then((x) => {
    throw new Error("fail at " + x);
  })
  .then((x) => console.log("never", x))
  .catch((e) => console.log(e.message))
  .finally(() => console.log("done"));`,
        codeLanguage: "javascript",
        options: ["fail at 1\ndone", "never 2\ndone", "fail at 2\ndone", "fail at 2"],
        correct: [2],
        explanation: "1 → 2, phir throw hua \"fail at 2\". Rejection beech wale `.then` ko skip karke `.catch` tak gaya. `.finally` hamesha chalta hai, toh \"done\" bhi.",
        tags: ["chaining", "errors"],
      },
      {
        type: "SCENARIO",
        difficulty: 3,
        prompt: "A product page calls getProduct(), then getReviews(), then getOffers() one after another; each takes ~300ms and none depends on the others. The page takes ~900ms. What is the best improvement?",
        options: [
          "Wrap each call in setTimeout(fn, 0)",
          "Run them in parallel with Promise.all([getProduct(), getReviews(), getOffers()])",
          "Use Promise.race so the fastest one is used",
          "Add more .then calls",
        ],
        correct: [1],
        explanation: "Teeno independent hain, toh parallel chalao. Promise.all ka time ≈ sabse slow call (~300ms), sum nahi. race sirf ek result deta, jo yahan galat hai.",
        tags: ["parallel"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order what happens for `new Promise(r => setTimeout(() => r(5), 10)).then(v => console.log(v));`",
        options: [
          "The executor runs immediately and schedules a 10ms timer",
          "then registers the callback while the promise is pending",
          "After 10ms the timer fires and calls r(5)",
          "The promise becomes fulfilled and the callback is queued as a microtask",
          "The callback runs and prints 5",
        ],
        explanation: "Executor sync chalta hai → then callback register hota hai → timer fire → resolve → microtask queue → callback chalta hai.",
        tags: ["lifecycle"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain how promise chaining solves 'callback hell', including how errors are handled in a chain.",
        keywords: ["new promise", "return", "flat", "single catch", "propagate"],
        explanation: "Har `.then` naya promise return karta hai, toh nesting ki jagah flat chain banti hai. Callback ka return value agle step ko milta hai. Kisi bhi step pe error ho toh woh neeche propagate hota hai aur ek hi `.catch` sabko handle kar leta hai.",
        tags: ["chaining"],
      },
    ],
    buildTask: {
      title: "Simulate Promise.all",
      description: `Promise.all ka result bina asli async ke **predict** karo! Function \`simulatePromiseAll(tasks)\` banao.

Har task ek object hai:
- Success: \`{ "ok": true, "value": <any>, "ms": <number> }\` — itne ms baad fulfil hoga.
- Failure: \`{ "ok": false, "reason": <string>, "ms": <number> }\` — itne ms baad reject hoga.

Return karo jo \`Promise.all\` deta:
- Agar sab ok: \`{ "status": "fulfilled", "value": [values **input ke order** mein] }\` (ms se order nahi badalta!)
- Agar koi bhi fail: \`{ "status": "rejected", "reason": <us failed task ka reason jo **sabse pehle** (sabse kam ms) reject hua> }\`. Tie ho toh pehle index wala.
- Khaali list → \`{ "status": "fulfilled", "value": [] }\``,
      functionName: "simulatePromiseAll",
      starterJs: `function simulatePromiseAll(tasks) {
  // decide what Promise.all would settle with
  return { status: "fulfilled", value: [] };
}`,
      starterPython: `def simulatePromiseAll(tasks):
    # decide what Promise.all would settle with
    return {"status": "fulfilled", "value": []}`,
      tests: [
        {
          name: "all succeed, input order kept",
          args: [[{ ok: true, value: 1, ms: 30 }, { ok: true, value: 2, ms: 10 }]],
          expected: { status: "fulfilled", value: [1, 2] },
        },
        { name: "empty list", args: [[]], expected: { status: "fulfilled", value: [] } },
        {
          name: "one failure",
          args: [[{ ok: true, value: "a", ms: 5 }, { ok: false, reason: "timeout", ms: 50 }]],
          expected: { status: "rejected", reason: "timeout" },
        },
        {
          name: "earliest rejection wins",
          args: [[{ ok: false, reason: "A", ms: 100 }, { ok: false, reason: "B", ms: 20 }]],
          expected: { status: "rejected", reason: "B" },
        },
        {
          name: "tie goes to lower index",
          args: [[{ ok: false, reason: "X", ms: 10 }, { ok: false, reason: "Y", ms: 10 }]],
          expected: { status: "rejected", reason: "X" },
          hidden: true,
        },
        {
          name: "slow rejection still rejects",
          args: [[{ ok: true, value: 1, ms: 1 }, { ok: false, reason: "bad", ms: 500 }, { ok: true, value: 3, ms: 2 }]],
          expected: { status: "rejected", reason: "bad" },
          hidden: true,
        },
      ],
      hints: [
        "Promise.all ke do rules: (1) fulfilled values hamesha input order mein, (2) pehli rejection (time ke hisaab se) poore result ko reject kar deti hai.",
        "Pehle saare failed tasks nikaalo. Agar koi nahi, toh values ka array return karo. Warna failed tasks mein se sabse kam ms wala dhoondho (tie pe pehla).",
        "const failed = tasks.filter(t => !t.ok); if (failed.length === 0) return { status: 'fulfilled', value: tasks.map(t => t.value) }; let first = failed[0]; for (const t of failed) if (t.ms < first.ms) first = t;",
      ],
      explainQuestions: [
        { question: "Why are fulfilled values returned in input order and not in the order they finished?", keywords: ["input order", "index", "promise.all", "position"] },
        { question: "Why does the earliest rejection decide the result, even if later tasks would succeed?", keywords: ["first rejection", "settle once", "fail fast"] },
        { question: "How would the result differ if this were Promise.allSettled?", keywords: ["every result", "status", "no reject", "allsettled"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "What is a Promise and what problem does it solve?",
        short: "A Promise is an object representing a value that will be available later: it starts pending and settles once as fulfilled with a value or rejected with a reason. It solves callback hell by allowing flat chaining with then, centralised error handling with catch, and easy composition of async work with Promise.all and friends.",
        deep: `- States: pending → fulfilled | rejected; settled exactly once.
- \`.then\` returns a new promise, enabling chaining; returned promises are flattened (adopted).
- Reactions run as **microtasks**, so \`.then\` is always async.
- Errors propagate down the chain to the nearest \`.catch\`.
- Combinators: \`all\` (fail-fast), \`allSettled\` (all outcomes), \`race\` (first settled), \`any\` (first fulfilled, AggregateError if all fail).`,
        followUps: [
          "What is the difference between Promise.all and Promise.allSettled?",
          "What happens if you throw inside a then callback?",
          "How would you add a timeout to a promise?",
        ],
        commonMistake: "Saying promises make code run in parallel or on another thread; they only represent results of async operations.",
        keywords: ["pending", "fulfilled", "rejected", "chaining", "microtask"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
      {
        question: "Compare Promise.all, Promise.allSettled, Promise.race and Promise.any.",
        short: "Promise.all fulfils with all values in input order or rejects as soon as any input rejects. allSettled always fulfils with an array of status objects for every input. race settles with whichever input settles first, success or failure. any fulfils with the first fulfilled value and only rejects, with an AggregateError, if all inputs reject.",
        deep: `- **all**: checkout needing price + stock + address together.
- **allSettled**: dashboards and bulk operations with partial success.
- **race**: timeouts, \`Promise.race([work, timeout(5000)])\`.
- **any**: fastest successful mirror or CDN.
- None of them cancel the other pending operations; use \`AbortController\` for that.`,
        followUps: ["Does Promise.all cancel the other requests when one fails?", "What is an AggregateError?"],
        commonMistake: "Assuming Promise.all returns results in completion order rather than input order.",
        keywords: ["fail fast", "input order", "allsettled", "race", "aggregateerror"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
    ],
  },
  // ───────────────────────────────────────────────────────────────────────────
  // 9. Async / await
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "js-async-await",
    estMinutes: 50,
    difficulty: 2,
    prerequisites: ["js-promises"],
    objectives: [
      "async function aur await keyword ka matlab samajhna",
      "try / catch / finally se async errors handle karna",
      "Sequential await aur parallel Promise.all mein farak karke sahi choose karna",
      "forEach + await jaise common traps pehchanna",
    ],
    technicalDefinition:
      "async/await is syntax built on Promises in which an async function always returns a Promise and the await operator pauses that function's execution until the awaited Promise settles, resuming with its fulfilled value or throwing its rejection reason.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**async/await** promises ko likhne ka aasaan tareeka hai, jisse async code bilkul normal, upar se neeche wale code jaisa dikhta hai.

- Function ke aage \`async\` lagao: \`async function getOrder() {...}\`. Yeh function **hamesha ek promise return** karta hai, chahe tum andar seedha \`return 5\` likho.
- Andar \`await somePromise\` likho: function **wahin ruk** jaata hai jab tak promise settle na ho, phir uski value deta hai. Promise reject hua toh \`await\` wahan **error throw** karta hai, jise \`try/catch\` se pakadte ho.

\`\`\`js
async function showOrder() {
  try {
    const order = await getOrder(42);
    console.log(order.status);
  } catch (err) {
    console.log("Error:", err.message);
  }
}
\`\`\`

Dhyan do: sirf **async function** rukta hai, poora JavaScript (page, baaki code) nahi.`,
          en: `**async/await** is a cleaner way to write promise code so it reads top to bottom like normal code.

- An \`async\` function **always returns a promise**, even if you \`return 5\`.
- \`await promise\` **pauses that function** until the promise settles, then gives its value. If the promise rejects, \`await\` **throws**, so you use \`try/catch\`.

Only the async function pauses; the rest of JavaScript (the page, other code) keeps running.`,
          hi: `**async/await** promise वाले कोड को लिखने का आसान तरीका है, जिससे async कोड सामान्य, ऊपर से नीचे पढ़े जाने वाले कोड जैसा दिखता है।

- फ़ंक्शन के आगे \`async\` लगाने पर वह **हमेशा एक promise लौटाता है**।
- अंदर \`await\` लिखने पर वह फ़ंक्शन **वहीं रुक** जाता है जब तक promise पूरा न हो, फिर उसकी वैल्यू देता है। अगर promise reject हुआ तो \`await\` वहाँ **error फेंकता** है, जिसे \`try/catch\` से पकड़ते हैं।

ध्यान दें: केवल वह async फ़ंक्शन रुकता है, बाकी JavaScript और पेज चलते रहते हैं।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Chai stall pe token system** socho. Tumne order diya aur **token** mila (yeh promise hai).

\`.then\` wala style aisa hai: "Jab chai ban jaaye toh yeh karna, phir woh karna, phir..." — sab instructions pehle se ek chain mein likh ke dena.

\`await\` wala style aisa hai: tum counter ke paas side mein khade ho jaate ho aur bolte ho "**chai aane do, phir aage sochta hoon**". Chai aayi, piyi, phir agla kaam. Padhne mein bilkul normal kahani jaisa.

Important: tumhare wait karne se **chai wala ruka nahi**. Woh baaki customers ko serve kar raha hai (event loop baaki kaam karta rehta hai). Sirf **tum** (async function) ruke ho.

Aur agar doodh khatam ho gaya (promise reject), toh bhaiya seedha bolte hain "nahi milegi!" — yeh \`throw\` hai, aur tumhara \`catch\` plan B hai: "theek hai, coffee de do".

Ek mazedaar galti: teen dost alag-alag counters pe order de sakte the (parallel), lekin ek ne pehle chai ka wait kiya, phir samosa order kiya, phir jalebi. Teen guna time!`,
          en: `At a tea stall with **tokens**, your token is the promise. The \`.then\` style is handing over a chain of instructions in advance. The \`await\` style is standing aside and saying "**let the tea come, then I will decide the next step**". It reads like a normal story.

Your waiting does **not stop the tea seller**; he keeps serving others (the event loop keeps working). Only **you** (the async function) pause.

If the milk runs out (rejection), the seller says "not available" (a \`throw\`), and your \`catch\` is plan B. A classic mistake: ordering tea, waiting, then ordering samosas, then jalebi, when all three could be ordered at once.`,
          hi: `**चाय की दुकान पर टोकन सिस्टम** सोचिए। आपने ऑर्डर दिया और **टोकन** मिला, यही promise है।

\`await\` वाला तरीका ऐसा है: आप काउंटर के पास खड़े होकर कहते हैं "**चाय आने दो, फिर आगे सोचता हूँ**"। चाय आई, पी, फिर अगला काम। पढ़ने में बिल्कुल सामान्य कहानी जैसा।

ज़रूरी बात: आपके इंतज़ार से **चाय वाला रुका नहीं**, वह बाकी ग्राहकों को देता रहता है। केवल आप (async फ़ंक्शन) रुके हैं।

अगर दूध ख़त्म हो गया (promise reject), तो भैया कहते हैं "नहीं मिलेगी!" यह \`throw\` है, और आपका \`catch\` प्लान B है: "ठीक है, कॉफ़ी दे दो"।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Promises ne callback hell khatam kiya, lekin lambi \`.then\` chains mein phir bhi dikkat thi:

- **Beech ke results use karna mushkil**: step 3 ko step 1 ki value chahiye? Bahar variable banao ya nesting wapas.
- **Conditions aur loops awkward**: "jab tak payment pending hai, har 2 second check karo" \`.then\` se likhna complicated hai.
- **Do tarah ki error handling**: sync errors ke liye try/catch, async ke liye \`.catch\`.

**async/await (ES2017)** ne yeh sab solve kiya:
- Code **synchronous jaisa** padhta hai: line 1, line 2, line 3.
- Normal \`if\`, \`for\`, \`while\` ke saath \`await\` seedha kaam karta hai.
- Ek hi \`try/catch\` sync aur async dono errors pakadta hai.
- Stack traces aur debugging (step over) zyada natural.

Andar se yeh abhi bhi promises hi hain, isliye promises samajhna zaroori tha. async/await bas unke upar ek saaf syntax hai.`,
          en: `Promises ended callback hell, but long \`.then\` chains still struggled with using earlier results later, writing loops and conditions, and having two styles of error handling.

**async/await (ES2017)** fixes that: code reads like synchronous code, \`await\` works inside normal \`if\`/\`for\`/\`while\`, a single \`try/catch\` handles both sync and async errors, and debugging feels natural.

Underneath it is still promises, which is why promises come first.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Express / NestJS backends (Swiggy, Zomato jaisi companies ke Node services)**: route handlers \`async (req, res) => { const user = await db.user.findUnique(...); ... }\`. Prisma, Mongoose, Redis clients sab promise dete hain, toh har query pe \`await\`.
- **Next.js (Hotstar, Nykaa web jaise sites)**: Server Components seedha \`async function Page() { const data = await getProducts(); ... }\` likhte hain.
- **Payment status polling (Paytm / PhonePe merchant integrations)**: \`while (status === "PENDING") { await sleep(2000); status = await checkStatus(id); }\` — loop + await, \`.then\` se kaafi mushkil hota.
- **Scripts aur CLIs**: data migration scripts \`for (const user of users) { await migrate(user); }\` likhte hain taaki ek-ek karke chale aur database pe load na pade.

Modern JavaScript codebases mein naya async code almost hamesha async/await mein hi likha jaata hai.`,
          en: `- **Express / NestJS backends**: async route handlers \`await\` Prisma, Mongoose or Redis calls.
- **Next.js (Hotstar, Nykaa-style sites)**: async Server Components \`await getProducts()\` directly.
- **Payment polling (UPI merchant integrations)**: \`while (status === "PENDING") { await sleep(2000); ... }\`.
- **Migration scripts**: \`for...of\` with \`await\` processes users one by one to avoid overloading the database.

New async code in modern codebases is almost always async/await.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `async/await andar se kya karta hai:

1. \`async function\` call hote hi turant chalna shuru hota hai, **pehle \`await\` tak synchronously**.
2. \`await x\` pe: \`x\` ko promise mein wrap kiya jaata hai (\`Promise.resolve(x)\`). Function ka current state (local variables, kis line pe tha) save hota hai aur function **pause** hoke caller ko ek pending promise return kar deta hai. Call stack khaali ho jaata hai, toh baaki code chal sakta hai.
3. Jab awaited promise settle hota hai, function ka **resume** hona ek **microtask** ke roop mein queue hota hai. Fulfilled → \`await\` value deta hai; rejected → wahi line throw karti hai.
4. Function ka \`return v\` → returned promise fulfil hota hai \`v\` se. Andar uncaught \`throw\` → returned promise reject.

Yeh concept **generators + promises** jaisa hai (pause/resume), jise engine natively implement karta hai. Isliye \`await\` ke baad wala code hamesha sync code ke baad chalta hai, chahe promise pehle se resolved ho (\`await null\` bhi pause karta hai).`,
          en: `1. Calling an async function runs it **synchronously until the first \`await\`**.
2. At \`await x\`, \`x\` is wrapped with \`Promise.resolve\`, the function's state is saved, it **pauses** and returns a pending promise to the caller. The call stack empties.
3. When the awaited promise settles, resuming is queued as a **microtask**: fulfilment gives the value, rejection throws at that line.
4. \`return v\` fulfils the returned promise; an uncaught \`throw\` rejects it.

It works like generators plus promises, implemented natively. Even \`await null\` pauses until the current sync code finishes.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Code mein async/await ke main patterns:

- \`fetchItem\` ek fake API hai (sirf \`setTimeout\`, network nahi).
- \`sequential()\`: teen \`await\` ek ke baad ek; total time ≈ 30+30+30 = 90ms.
- \`parallel()\`: teeno promises pehle start kiye, phir \`await Promise.all\`; time ≈ 30ms. Output round karke dikhaya hai taaki stable rahe.
- \`safeOrder()\`: rejected promise ko \`await\` kiya toh error throw hua, \`catch\` ne pakda, \`finally\` hamesha chala.
- Top-level pe \`main()\` call hua; "sync done" pehle print hota hai kyunki \`main\` pehle \`await\` pe ruk gaya.

Python ka \`asyncio\` almost same syntax use karta hai: \`async def\`, \`await\`, \`asyncio.gather\` (Promise.all), aur \`try/except/finally\`. Farak: Python mein \`asyncio.run(main())\` se event loop khud start karna padta hai.`,
          en: `The code shows: a fake API with \`setTimeout\`; \`sequential()\` awaiting three calls one by one (~90ms); \`parallel()\` starting all three and awaiting \`Promise.all\` (~30ms); \`safeOrder()\` where awaiting a rejected promise throws into \`catch\` and \`finally\` always runs. "sync done" prints first because \`main\` pauses at its first \`await\`.

Python's \`asyncio\` mirrors this with \`async def\`, \`await\`, \`asyncio.gather\` and \`try/except/finally\`, but you start the loop with \`asyncio.run\`.`,
        },
        codeJs: `const fetchItem = (name, ms, fail = false) =>
  new Promise((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error(name + " failed")) : resolve(name)), ms)
  );

async function sequential() {
  const start = Date.now();
  const a = await fetchItem("menu", 30);
  const b = await fetchItem("offers", 30);
  const c = await fetchItem("reviews", 30);
  const ms = Math.round((Date.now() - start) / 30) * 30;
  console.log("sequential:", [a, b, c].join(","), "~" + ms + "ms");
}

async function parallel() {
  const start = Date.now();
  const [a, b, c] = await Promise.all([
    fetchItem("menu", 30),
    fetchItem("offers", 30),
    fetchItem("reviews", 30),
  ]);
  const ms = Math.round((Date.now() - start) / 30) * 30;
  console.log("parallel:", [a, b, c].join(","), "~" + ms + "ms");
}

async function safeOrder() {
  try {
    await fetchItem("payment", 10, true);
    console.log("never printed");
  } catch (err) {
    console.log("caught:", err.message);
  } finally {
    console.log("hide loader");
  }
}

async function main() {
  await sequential();
  await parallel();
  await safeOrder();
  const value = await (async () => 42)();
  console.log("async returns a promise, awaited value:", value);
}

main();
console.log("sync done");`,
        codePython: `import asyncio
import time

async def fetch_item(name, ms, fail=False):
    await asyncio.sleep(ms / 1000)
    if fail:
        raise RuntimeError(name + " failed")
    return name

async def sequential():
    start = time.perf_counter()
    a = await fetch_item("menu", 30)
    b = await fetch_item("offers", 30)
    c = await fetch_item("reviews", 30)
    ms = round((time.perf_counter() - start) * 1000 / 30) * 30
    print("sequential:", ",".join([a, b, c]), "~" + str(ms) + "ms")

async def parallel():
    start = time.perf_counter()
    a, b, c = await asyncio.gather(
        fetch_item("menu", 30), fetch_item("offers", 30), fetch_item("reviews", 30)
    )
    ms = round((time.perf_counter() - start) * 1000 / 30) * 30
    print("parallel:", ",".join([a, b, c]), "~" + str(ms) + "ms")

async def safe_order():
    try:
        await fetch_item("payment", 10, True)
        print("never printed")
    except RuntimeError as err:
        print("caught:", err)
    finally:
        print("hide loader")

async def main():
    await sequential()
    await parallel()
    await safe_order()

print("sync done")
asyncio.run(main())`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `- **\`await\` bhoolna**: \`const user = getUser(id); console.log(user.name)\` → \`user\` promise hai, \`undefined\` ya crash. Har promise-returning call pe \`await\`.
- **\`forEach\` ke andar \`await\`**: \`items.forEach(async (i) => await save(i))\` — forEach wait nahi karta, function aage badh jaata hai aur errors bhi pakde nahi jaate. \`for...of\` (sequential) ya \`Promise.all(items.map(...))\` (parallel) use karo.
- **Bina wajah sequential**: independent calls ko ek-ek \`await\` karna. Pehle sab start karo, phir \`Promise.all\`.
- **try/catch na lagana**: rejected await ka error upar tak jaata hai; Express 4 mein yeh request hang kar sakta hai.
- **\`await\` non-async function mein**: SyntaxError (ES modules ka top-level await chhod ke).
- **async function ka return use karna bina await**: \`if (await isValid())\` likhna tha, \`if (isValid())\` hamesha true (promise truthy hai)!
- **\`return await\` vs \`return\`**: try block ke andar \`return promise\` (bina await) ka error catch mein nahi aata. Wahan \`return await\` likho.`,
          en: `- Forgetting \`await\`, so you work with a promise instead of a value.
- \`await\` inside \`forEach\` does not wait; use \`for...of\` or \`Promise.all(items.map(...))\`.
- Awaiting independent calls sequentially.
- Missing \`try/catch\`; in Express 4 a rejection can hang the request.
- Using \`await\` outside an async function (except top-level in ES modules).
- \`if (isValid())\` without await is always true because a promise is truthy.
- Inside \`try\`, \`return promise\` without \`await\` skips the \`catch\`; use \`return await\`.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `async/await bugs debug karne ke tareeke:

1. **\`Promise { <pending> }\` ya \`[object Promise]\` dikha?** Kahin \`await\` miss hua hai. Woh line dhoondho jahan value use ho rahi hai aur check karo function async hai ya nahi.
2. **Time measure karo**: \`console.time("load"); await loadAll(); console.timeEnd("load");\`. Expected se 3x slow hai toh calls sequential chal rahi hain jo parallel ho sakti thi.
3. **Breakpoints with step over**: DevTools mein \`await\` wali line pe "Step over" (F10) promise settle hone tak wait karta hai aur agli line pe rukta hai, bilkul sync code jaisa.
4. **Error kahan se aaya?** Chrome/Node async stack traces dikhate hain (\`at async getOrders\`). Error message ke saath \`err.stack\` log karo.
5. **Hang ho gaya**: koi await kabhi resolve hi nahi ho raha. Har await se pehle aur baad log lagao ("before payment", "after payment") — jahan "after" nahi aaya, wahi atka hai. Timeout wrapper lagao.
6. **ESLint rules**: \`no-await-in-loop\` (galti se sequential) aur \`@typescript-eslint/no-floating-promises\` (await bhoolna) on karo.`,
          en: `1. Seeing \`Promise { <pending> }\`? A missing \`await\`.
2. Measure with \`console.time\`; unexpected slowness often means accidental sequential awaits.
3. "Step over" an \`await\` in DevTools waits for it and stops at the next line.
4. Read async stack traces (\`at async getOrders\`) and log \`err.stack\`.
5. Hanging? Log before and after each await to find the one that never settles; add a timeout.
6. Enable ESLint \`no-await-in-loop\` and \`no-floating-promises\`.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Sequential vs parallel**: \`await\` ek-ek karke likhna aasaan hai par slow. Jab calls ek doosre pe depend karti hain (pehle user, phir uske orders), tab sequential sahi hai. Independent calls → \`Promise.all\`.
- **Parallel ki bhi limit**: 10,000 users ke liye ek saath \`Promise.all\` database ya third-party API ko overload kar dega (rate limit). Batches mein chalao (50-50) ya \`p-limit\` jaisi concurrency limit lagao.
- **try/catch har jagah vs ek jagah**: har function mein try/catch noise badhata hai. Errors ko upar tak jaane do aur ek central jagah (Express error middleware) handle karo; sirf wahan local catch lagao jahan recover kar sakte ho (retry, fallback).
- **async/await vs \`.then\`**: chhote one-liners aur \`Promise.all(...).then(...)\` jaisi cheezein \`.then\` se bhi theek hain. Dono mix karna allowed hai, lekin ek function mein ek style rakho.
- **Har function async banana**: zaroorat nahi. Async function hamesha promise deta hai, jisse caller ko bhi await karna padta hai ("async infects everything").`,
          en: `- **Sequential vs parallel**: dependent calls must be sequential; independent ones belong in \`Promise.all\`.
- **Unbounded parallelism** can overload databases or hit rate limits; batch or use a concurrency limit like \`p-limit\`.
- **Where to catch**: let errors bubble to a central handler and catch locally only where you can recover.
- **\`.then\` vs await**: both are fine; keep one style per function.
- Do not make functions async without need; async-ness spreads to every caller.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real Express + Prisma backend mein ek order details endpoint:

\`\`\`js
app.get("/orders/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "NOT_FOUND" });

    // order mil gaya, ab yeh dono independent hain -> parallel
    const [rider, restaurant] = await Promise.all([
      prisma.rider.findUnique({ where: { id: order.riderId } }),
      prisma.restaurant.findUnique({ where: { id: order.restaurantId } }),
    ]);
    res.json({ order, rider, restaurant });
  } catch (err) {
    next(err); // central error middleware log karega aur 500 bhejega
  }
});
\`\`\`

Pehla await zaroori hai (baaki ko \`order\` chahiye), phir do independent queries parallel. Errors \`next(err)\` se central handler tak. Code review mein dekha jaata hai: missing await, forEach + await, aur aise sequential awaits jo parallel ho sakte the.`,
          en: `In an Express + Prisma order endpoint, the first \`await\` loads the order (everything else depends on it), returns 404 if missing, then fetches rider and restaurant in parallel with \`Promise.all\` because they are independent. Errors go to \`next(err)\` for a central error middleware.

Reviewers look for missing awaits, \`forEach\` with \`await\`, and sequential awaits that could run in parallel.`,
        },
      },
    ],
    visualization: {
      kind: "CODE_EXECUTION",
      title: "await pe function pause aur resume",
      steps: [
        { title: "main() call", description: "console.log('start') ho chuka. main() call hua aur synchronously chalna shuru hua.", highlight: "main()" },
        { title: "Pehla await", description: "await getUser() pe main pause hua. Uska state save hua aur caller ko pending promise mila. Call stack khaali.", highlight: "await getUser()" },
        { title: "Sync code aage", description: "main ke baad wali line console.log('end') chal gayi. Event loop free hai, UI responsive hai.", highlight: "console.log('end')" },
        { title: "Promise settle", description: "getUser ka promise fulfil hua. main ko resume karna microtask queue mein gaya.", highlight: "microtask: resume main" },
        { title: "Resume", description: "main wahin se shuru hua jahan ruka tha, user variable mein value aayi aur agli line chali.", highlight: "const user = ..." },
        { title: "Return", description: "main khatam hua; jo return kiya woh main() ke promise ki fulfilled value ban gaya.", highlight: "return → fulfilled" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does an async function always return?",
        options: ["The value written after return", "undefined", "A Promise", "A callback"],
        correct: [2],
        explanation: "async function hamesha promise return karta hai. `return 5` likha toh promise 5 se fulfil hoga; value lene ke liye `await` ya `.then` chahiye.",
        tags: ["async"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "What happens when you `await` a promise that rejects?",
        options: [
          "await returns undefined",
          "await throws the rejection reason at that line",
          "The program silently continues",
          "await retries the promise",
        ],
        correct: [1],
        explanation: "Rejected promise ko await karne pe wahi line error throw karti hai, isliye `try/catch` mein lapette hain. Catch nahi kiya toh async function ka returned promise reject hoga.",
        tags: ["errors"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Three independent API calls each take 200ms. Which code finishes in about 200ms total?",
        options: [
          "const a = await f1(); const b = await f2(); const c = await f3();",
          "const [a, b, c] = await Promise.all([f1(), f2(), f3()]);",
          "for (const f of [f1, f2, f3]) await f();",
          "[f1, f2, f3].forEach(async (f) => await f());",
        ],
        correct: [1],
        explanation: "Promise.all mein teeno calls ek saath start hoti hain, toh total ≈ 200ms. Pehla aur teesra option sequential hain (≈600ms). forEach wala wait hi nahi karta, toh results milte hi nahi.",
        tags: ["parallel"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which statements about await are true? (Select all that apply)",
        options: [
          "await pauses only the async function it is in, not the whole program",
          "await blocks the browser's UI until the promise settles",
          "Code after await runs as a microtask after the current synchronous code",
          "await can be used inside a normal (non-async) function",
        ],
        correct: [0, 2],
        explanation: "await sirf apne async function ko rokta hai, UI ko nahi; resume microtask se hota hai. Normal function mein await SyntaxError hai (ES module ke top level ko chhod ke).",
        tags: ["internals"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `async function f() {
  console.log("1");
  await null;
  console.log("2");
}
console.log("start");
f();
console.log("end");`,
        codeLanguage: "javascript",
        options: ["start\n1\n2\nend", "start\n1\nend\n2", "start\nend\n1\n2", "1\nstart\nend\n2"],
        correct: [1],
        explanation: "f() pehle await tak sync chalta hai, toh \"1\" turant. `await null` pe pause, control wapas, \"end\" print. Phir microtask mein resume hoke \"2\".",
        tags: ["ordering"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `async function getScore() {
  return 42;
}
const r = getScore();
console.log(r instanceof Promise);
r.then((v) => console.log(v));`,
        codeLanguage: "javascript",
        options: ["false\n42", "true\n42", "42\n42", "true\nundefined"],
        correct: [1],
        explanation: "async function ka return hamesha promise mein lipta hota hai, toh `r instanceof Promise` true. `.then` se andar ki value 42 milti hai.",
        tags: ["async"],
      },
      {
        type: "SCENARIO",
        difficulty: 3,
        prompt: "A script does `users.forEach(async (u) => { await sendEmail(u); }); console.log(\"All emails sent\");`. The log appears instantly and some failures crash the process with unhandled rejections. What is the best fix?",
        options: [
          "Add await before users.forEach",
          "Use for...of with await (or await Promise.all(users.map(sendEmail))) inside a try/catch",
          "Replace async with a setTimeout",
          "Use users.map without await",
        ],
        correct: [1],
        explanation: "forEach callbacks ke promises ko ignore karta hai, toh na wait hota hai na errors catch hote hain. `await forEach(...)` bhi kaam nahi karega kyunki forEach undefined return karta hai. for...of (ek-ek) ya Promise.all (parallel) ke saath try/catch sahi hai.",
        tags: ["foreach-await"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order what happens when an async function hits `const data = await load();`",
        options: [
          "load() is called and returns a promise",
          "The async function pauses and its saved state waits",
          "Control returns to the caller and other synchronous code runs",
          "The promise fulfils and resuming the function is queued as a microtask",
          "The function resumes and data receives the fulfilled value",
        ],
        explanation: "Pehle load() call hota hai, phir await pe pause, caller ka sync code chalta hai, promise settle hone pe resume microtask queue hota hai, aur phir value variable mein aati hai.",
        tags: ["internals"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain when you should await calls one after another and when you should use Promise.all. Give an example of each.",
        keywords: ["depends", "independent", "parallel", "sequential", "total time"],
        explanation: "Jab agli call ko pichli ka result chahiye (pehle order, phir uska rider) tab sequential await. Jab calls independent hain (menu, offers, reviews) tab Promise.all, kyunki total time sabse slow call jitna hota hai, sum nahi.",
        tags: ["parallel"],
      },
    ],
    buildTask: {
      title: "Estimate async page load time",
      description: `Ek page kai **steps** mein data load karta hai. Har step ek group hai jiske andar ki calls \`Promise.all\` se **parallel** chalti hain; steps khud **ek ke baad ek** (\`await\`) chalte hain.

Function \`estimateAsyncTime(groups)\` banao:
- \`groups\`: array of arrays, har number ek call ka time (ms).
- Ek group ka time = uski **sabse slow** call (parallel). Khaali group = 0.
- Total = saare groups ke time ka **sum** (sequential).

Example: \`[[100], [200, 300], [50]]\` → 100 + 300 + 50 = \`450\`

Yeh soch interview mein bahut kaam aati hai: "is code ko fast kaise karoge?"`,
      functionName: "estimateAsyncTime",
      starterJs: `function estimateAsyncTime(groups) {
  // sum of (max of each group)
  return 0;
}`,
      starterPython: `def estimateAsyncTime(groups):
    # sum of (max of each group)
    return 0`,
      tests: [
        { name: "mixed groups", args: [[[100], [200, 300], [50]]], expected: 450 },
        { name: "no groups", args: [[]], expected: 0 },
        { name: "everything parallel", args: [[[100, 200, 300]]], expected: 300 },
        { name: "everything sequential", args: [[[100], [200], [300]]], expected: 600 },
        { name: "empty group counts as 0", args: [[[], [40]]], expected: 40, hidden: true },
        { name: "zeros and ties", args: [[[5, 5], [10, 1], [0]]], expected: 15, hidden: true },
      ],
      hints: [
        "Parallel calls ka time = sabse lambi call (Promise.all sabka wait karta hai). Sequential steps ka time = sab ka jod.",
        "Har group ke liye max nikaalo (khaali ho toh 0), phir in sab max values ko jodo.",
        "return groups.reduce((total, g) => total + (g.length ? Math.max(...g) : 0), 0);  // Python: sum(max(g) if g else 0 for g in groups)",
      ],
      explainQuestions: [
        { question: "Why is a group's time the maximum and not the sum?", keywords: ["parallel", "promise.all", "slowest", "same time"] },
        { question: "Why are the group times added together?", keywords: ["sequential", "await", "one after another"] },
        { question: "How would you restructure [[100],[200],[300]] if the three calls were independent?", keywords: ["one group", "promise.all", "300", "parallel"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "How does async/await relate to Promises?",
        short: "async/await is syntax on top of promises. An async function always returns a promise, and await pauses that function until a promise settles, giving its value or throwing its rejection. It does not block the thread; the rest of the program keeps running, and the function resumes later as a microtask.",
        deep: `- \`async function f() { return 1 }\` ≡ a function returning \`Promise.resolve(1)\`.
- \`await p\` ≈ \`p.then(rest of function)\`, with rejection turned into a throw.
- Error handling with \`try/catch/finally\` covers both sync and async errors.
- Parallelism still needs \`Promise.all\`; \`await\` alone is sequential.
- Top-level \`await\` works in ES modules.`,
        followUps: [
          "What happens if you forget try/catch around an awaited rejection?",
          "Why does await inside forEach not work as expected?",
          "What is the difference between return and return await inside try?",
        ],
        commonMistake: "Saying await blocks the JavaScript thread or makes code synchronous.",
        keywords: ["syntactic sugar", "returns promise", "pause", "microtask", "try catch"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
      {
        question: "You have three independent awaits that make a page slow. How would you speed it up, and what are the risks?",
        short: "Start all three promises first and await them together with Promise.all, so the total time becomes the slowest call instead of the sum. If partial results are acceptable, use Promise.allSettled. The risks are fail-fast behaviour of Promise.all and overloading downstream services if you parallelise too much, so for large lists you limit concurrency or batch.",
        deep: `\`\`\`js
const [menu, offers] = await Promise.all([getMenu(id), getOffers(id)]);
\`\`\`
- Identify true dependencies first; only independent calls can run in parallel.
- \`Promise.all\` rejects on the first failure but does not cancel the others.
- For thousands of items, use batches or a limiter (\`p-limit\`) to respect rate limits and connection pools.
- Measure with \`console.time\` or tracing before and after.`,
        followUps: ["How would you limit concurrency to 5 at a time?", "How do you cancel the remaining requests when one fails?"],
        commonMistake: "Wrapping sequential awaits in Promise.all after they have already been awaited, which gives no speedup.",
        keywords: ["promise.all", "independent", "parallel", "concurrency limit", "allsettled"],
        difficulty: 3,
        roles: ["BACKEND", "FULLSTACK", "FRONTEND", "SDE"],
      },
    ],
    promptCard: {
      title: "Find slow or broken awaits",
      category: "OPTIMIZATION",
      task: "Review async/await code for missing awaits, await-in-forEach bugs and sequential calls that could run in parallel.",
      whenToUse: "Jab async function slow chal raha ho, kabhi-kabhi `undefined`/`Promise { <pending> }` aa raha ho, ya unhandled rejection errors dikh rahe hon.",
      template: `Review this async JavaScript code.

\`\`\`js
[PASTE_CODE]
\`\`\`

Context: [WHAT_IT_DOES]
Problem I see: [SYMPTOM]

Please check, line by line:
1. Any promise-returning call that is missing await.
2. Any await inside forEach/map without Promise.all.
3. Which awaits are independent and could run in parallel with Promise.all (draw the dependency order).
4. Where a rejection is not caught and what would happen.
5. Rewrite the function with the fixes and estimate the time before vs after, assuming each call takes [CALL_TIME_MS] ms.
Explain each fix in one simple sentence.`,
      variables: [
        { key: "PASTE_CODE", label: "Your async function(s)" },
        { key: "WHAT_IT_DOES", label: "What the code is supposed to do" },
        { key: "SYMPTOM", label: "Slow, undefined values, crash, etc." },
        { key: "CALL_TIME_MS", label: "Rough time per call in ms" },
      ],
      whyItWorks: [
        { part: "Specific checklist of bug types", why: "AI ko exactly woh 4 common async bugs check karne ko bola, toh jawab focused aata hai." },
        { part: "Dependency order", why: "Parallel tabhi safe hai jab calls independent hon; dependency dikhane se galat parallelisation nahi hota." },
        { part: "Time before vs after", why: "Ek number milta hai jise tum console.time se khud verify kar sakte ho." },
      ],
      verifyChecklist: [
        "Rewritten code ko chala ke same output confirm karo.",
        "console.time / console.timeEnd se purana aur naya time measure karo.",
        "Ek call ko jaan-boojh ke fail karwa ke dekho ki error sahi jagah catch hota hai.",
      ],
      sampleOutput: `1. Line 4: getOffers(id) is missing await → offers is a Promise.
2. Line 9: items.forEach(async ...) does not wait; use await Promise.all(items.map(save)).
3. getMenu and getOffers are independent → run together. getRider depends on order → stays after.
4. No try/catch: a rejection in save() becomes an unhandled rejection.
Estimated time: before 4 × 200 = 800ms, after 200 (order) + 200 (parallel) = 400ms.`,
    },
  },
  // ───────────────────────────────────────────────────────────────────────────
  // 10. The event loop, microtasks and macrotasks
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: "js-event-loop",
    estMinutes: 55,
    difficulty: 3,
    prerequisites: ["js-promises", "js-async-await"],
    objectives: [
      "Call stack, Web APIs, microtask queue aur macrotask queue ka role samajhna",
      "setTimeout, Promise.then aur await wale code ka output order predict karna",
      "Samajhna ki setTimeout(fn, 0) turant kyun nahi chalta",
      "Main thread block karne wale code ko pehchanna aur fix karna",
    ],
    technicalDefinition:
      "The event loop is the runtime mechanism that, whenever the call stack is empty, first drains the microtask queue (promise reactions, queueMicrotask) and then takes the next macrotask (timers, I/O, UI events) from the task queue, allowing single-threaded JavaScript to handle asynchronous work without blocking.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `JavaScript **single-threaded** hai: ek time pe sirf ek kaam, ek **call stack**. Phir bhi timers, network calls aur clicks saath-saath kaise handle hote hain? Jawab hai **event loop**.

Chaar hisse yaad rakho:
- **Call stack**: abhi jo code chal raha hai.
- **Web APIs / Node APIs**: browser ya Node ke helpers jo timer, network, file ka kaam background mein karte hain.
- **Microtask queue**: promise ke \`.then\`, \`await\` ke baad ka code, \`queueMicrotask\`. **High priority**.
- **Macrotask (task) queue**: \`setTimeout\`, \`setInterval\`, click events, I/O callbacks.

**Event loop ka rule**: jab call stack khaali ho, pehle **saare microtasks** chalao, phir **ek macrotask** uthao, phir dobara microtasks... aur yeh chakkar chalta rehta hai.`,
          en: `JavaScript is **single-threaded**: one **call stack**, one thing at a time. The **event loop** is how it still handles timers, network calls and clicks.

Four parts:
- **Call stack**: code running right now.
- **Web/Node APIs**: background helpers for timers, network and files.
- **Microtask queue**: promise \`.then\`, code after \`await\`, \`queueMicrotask\`; high priority.
- **Macrotask queue**: \`setTimeout\`, \`setInterval\`, UI events, I/O callbacks.

**Rule**: when the stack is empty, run **all microtasks**, then **one macrotask**, then microtasks again, and repeat.`,
          hi: `JavaScript **single-threaded** है: एक समय पर एक ही काम, एक **call stack**। फिर भी टाइमर, नेटवर्क कॉल और क्लिक साथ-साथ कैसे संभलते हैं? जवाब है **event loop**।

चार हिस्से याद रखें:
- **Call stack**: अभी जो कोड चल रहा है।
- **Web APIs**: ब्राउज़र के सहायक जो टाइमर और नेटवर्क का काम पीछे करते हैं।
- **Microtask queue**: promise के \`.then\` और \`await\` के बाद का कोड, ऊँची प्राथमिकता।
- **Macrotask queue**: \`setTimeout\`, क्लिक इवेंट आदि।

नियम: जब call stack खाली हो, पहले **सारे microtasks** चलाओ, फिर **एक macrotask**, फिर दोबारा microtasks, और यह चक्र चलता रहता है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Ek akela chai wala** (single thread) socho, jiske stall pe bheed hai:

- **Call stack** = bhaiya jo chai abhi bana rahe hain. Ek time pe ek hi kaam.
- **Web APIs** = gas pe rakhi kettle aur dukaan ka chhotu. "5 minute baad doodh garam karna" (timer) ya "dukaan se biscuit le aao" (network) — yeh kaam bhaiya khud khade hoke nahi karte, chhotu/kettle karta hai.
- **Microtask queue** = **VIP line**: regular customers jinka order already chal raha tha, "bas cheeni aur daal do" jaise chhote follow-ups (\`.then\`).
- **Macrotask queue** = **normal line**: naye customers, timer ki ghanti, phone call (\`setTimeout\`, clicks).

Bhaiya ka rule (event loop): haath ka kaam khatam → **pehle VIP line poori khaali** → phir normal line se **sirf ek** customer → phir VIP line check → ...

Isliye \`setTimeout(fn, 0)\` ka matlab "turant" nahi, balki "normal line mein lag jao". Aur agar bhaiya ek 20 minute ka kaam (heavy loop) leke baith gaye, toh dono lines ruk jaati hain: page freeze!`,
          en: `Picture a **single tea seller** (one thread) with a crowd:

- **Call stack**: the tea he is making now.
- **Web APIs**: the kettle and helper boy who handle "warm milk in 5 minutes" (timer) or "fetch biscuits" (network).
- **Microtask queue**: the **VIP line** of quick follow-ups for orders already in progress (\`.then\`).
- **Macrotask queue**: the **normal line** of new customers and timer bells (\`setTimeout\`, clicks).

His rule: finish current work → **empty the whole VIP line** → serve **one** normal customer → check VIP again. So \`setTimeout(fn, 0)\` means "join the normal line", not "now". If he starts a 20-minute job (heavy loop), both lines stall: the page freezes.`,
          hi: `**एक अकेले चाय वाले** (single thread) की कल्पना कीजिए जिसकी दुकान पर भीड़ है:

- **Call stack**: भैया जो चाय अभी बना रहे हैं, एक समय पर एक ही काम।
- **Web APIs**: गैस पर रखी केतली और दुकान का छोटू, जो टाइमर और बाहर के काम करते हैं।
- **Microtask queue**: **VIP लाइन**, पहले से चल रहे ऑर्डर के छोटे काम (\`.then\`)।
- **Macrotask queue**: **सामान्य लाइन**, नए ग्राहक और टाइमर की घंटी (\`setTimeout\`, क्लिक)।

भैया का नियम: हाथ का काम ख़त्म → **पहले पूरी VIP लाइन खाली** → फिर सामान्य लाइन से **केवल एक** ग्राहक → फिर VIP लाइन। इसलिए \`setTimeout(fn, 0)\` का मतलब "तुरंत" नहीं, बल्कि "सामान्य लाइन में लग जाओ" है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Browser mein JavaScript usi **main thread** pe chalti hai jo page draw karta hai aur clicks handle karta hai. Agar JS network response ka wait karte hue thread rok de, toh 2 second tak button kaam nahi karenge, scroll atak jaayega.

Event loop isliye hai:
- **Non-blocking**: slow kaam (timer, network, disk) background APIs ko de do, aur result aane pe callback queue mein. Thread free rehta hai.
- **Ek thread, koi locks nahi**: multi-threading ke race conditions aur deadlocks ki tension nahi. Tumhara function beech mein kabhi interrupt nahi hota.
- **Priority**: microtasks pehle, taaki promise chains "ek saath" consistent state mein complete hon, phir rendering aur naye events.

**Developer ke liye kyun zaroori?** Kyunki output order predict karna (interview ka favourite sawaal!), "UI freeze kyun ho raha hai", "mera setTimeout late kyun chala", "state abhi update kyun nahi hua" — in sab ka jawab event loop hai. Node.js ka high-performance server bhi isi model pe hazaron connections ek thread pe sambhalta hai.`,
          en: `In the browser, JavaScript shares the **main thread** with rendering and input. Blocking it while waiting for a network response freezes buttons and scrolling.

The event loop provides:
- **Non-blocking** I/O: slow work is delegated, callbacks are queued.
- **One thread, no locks**: no race conditions inside your code, functions are never interrupted midway.
- **Priorities**: microtasks first so promise chains finish consistently, then rendering and new events.

It explains output-order puzzles, UI freezes and late timers, and lets Node.js serve thousands of connections on one thread.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `- **Node.js servers (PayPal, Netflix, LinkedIn ke kuch services, aur bahut Indian startups ke backends)**: ek hi thread hazaron requests sambhalta hai kyunki DB/network ka wait event loop pe hota hai, thread pe nahi. Agar kisi ne request handler mein bhaari sync kaam (jaise bada JSON.parse ya \`bcrypt\` sync) daal diya, toh **saare users** ki requests ruk jaati hain.
- **React (Facebook, Swiggy web)**: React 18 state updates ko batch karke microtask/scheduler ke saath baad mein apply karta hai; isliye \`setState\` ke turant baad state purani dikhti hai. React ka scheduler bade renders ko chhote tukdon mein todta hai taaki main thread free rahe.
- **Google Docs / Figma jaise heavy web apps**: lambe calculations ko chunks mein todte hain (\`setTimeout\` / \`requestIdleCallback\`) ya **Web Workers** (alag thread) mein bhejte hain, taaki typing smooth rahe.
- **Chrome DevTools Performance tab** mein "Long task" (50ms+) warnings isi event loop blocking ko dikhati hain.`,
          en: `- **Node.js servers** (PayPal, Netflix, many Indian startups) handle thousands of requests on one thread because I/O waits happen on the event loop; a heavy synchronous step in a handler stalls **every** user.
- **React** batches state updates and schedules work to keep the main thread free, which is why state looks stale right after \`setState\`.
- **Heavy web apps like Google Docs or Figma** split long work into chunks or move it to **Web Workers**.
- DevTools' "Long task" (50ms+) warnings point to event-loop blocking.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Ek loop iteration (browser, simplified):

1. **Macrotask queue se ek task** uthao (pehli baar poori script khud ek task hai) aur call stack pe chalao jab tak stack khaali na ho.
2. **Microtask checkpoint**: microtask queue **poori khaali** karo. Agar microtask ne naya microtask daala, toh woh bhi isi round mein chalega. (Isliye infinite microtasks page ko hamesha ke liye atka sakte hain.)
3. **Rendering** ka mauka (zaroorat ho toh, ~16ms pe): \`requestAnimationFrame\` callbacks, style, layout, paint.
4. Wapas step 1.

Kaun kahan jaata hai:
- \`Promise.then/catch/finally\`, \`await\` ke baad ka code, \`queueMicrotask\`, \`MutationObserver\` → **microtask**.
- \`setTimeout\`, \`setInterval\`, DOM events, \`MessageChannel\`, network/I/O callbacks → **macrotask**.

\`setTimeout(fn, 0)\` ka delay **minimum** hai, guarantee nahi: timer expire hone pe fn queue mein jaata hai, aur tabhi chalega jab stack khaali ho aur microtasks khatam. Nested timers browser mein 4ms tak clamp bhi hote hain.

**Node.js** mein loop ke **phases** hain (timers → pending → poll → check (\`setImmediate\`) → close), aur \`process.nextTick\` queue promise microtasks se bhi pehle chalti hai.`,
          en: `One loop iteration (simplified):

1. Take **one macrotask** (the initial script is one) and run it until the stack is empty.
2. **Microtask checkpoint**: drain the microtask queue completely, including microtasks queued meanwhile.
3. Optionally **render** (\`requestAnimationFrame\`, layout, paint).
4. Repeat.

Microtasks: promise reactions, code after \`await\`, \`queueMicrotask\`, \`MutationObserver\`. Macrotasks: timers, DOM events, I/O. A \`setTimeout\` delay is a **minimum**. Node.js splits the loop into phases (timers, poll, check for \`setImmediate\`...) and runs \`process.nextTick\` before promise microtasks.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yeh code har queue ka order dikhata hai:

- \`1\` aur \`7\`: sync code, call stack pe turant.
- \`setTimeout(..., 0)\` → macrotask queue ("6 timeout").
- \`Promise.resolve().then\` → microtask ("3 then"). Uske andar ek aur \`.then\` → naya microtask ("5 nested then") jo **isi round** mein chalega, timeout se pehle.
- \`queueMicrotask\` → microtask ("4").
- \`async\` function \`run()\`: "2 async start" sync chalta hai, \`await\` ke baad wala hissa microtask hai.

Final order: 1, 2, 7, then microtasks (3, after await, 4, 5), phir macrotask 6. Microtasks ka exact order queue mein jaane ke order pe depend karta hai.

Python ke \`asyncio\` mein microtask/macrotask ka alag concept nahi hai; \`call_soon\` aur naye task ready queue mein FIFO order mein jaate hain, aur \`call_later(0)\` timer agle loop round mein due hoke unke peeche lagta hai. Idea same: sync code pehle, scheduled callbacks baad mein, apne queue order mein.`,
          en: `The code shows queue ordering: "1" and "7" are synchronous; \`setTimeout(…, 0)\` goes to the macrotask queue; \`.then\` and \`queueMicrotask\` go to the microtask queue; a \`.then\` scheduled inside a microtask still runs in the same round, before the timeout; the async function runs synchronously until \`await\`, and the rest becomes a microtask. Final order: sync, all microtasks, then the timer.

Python's asyncio has no microtask/macrotask split, but the idea is the same: synchronous code finishes first, scheduled callbacks run later in order.`,
        },
        codeJs: `console.log("1 sync start");

setTimeout(() => console.log("6 timeout (macrotask)"), 0);

Promise.resolve().then(() => {
  console.log("3 then (microtask)");
  Promise.resolve().then(() => console.log("5 nested then (microtask)"));
});

async function run() {
  console.log("2 async start (sync part)");
  await null;
  console.log("3b after await (microtask)");
}
run();

queueMicrotask(() => console.log("4 queueMicrotask"));

console.log("7 sync end");`,
        codePython: `import asyncio

async def main():
    loop = asyncio.get_running_loop()
    print("1 sync start")
    loop.call_later(0, lambda: print("5 call_later(0) timer"))
    loop.call_soon(lambda: print("3 call_soon callback"))

    async def run():
        print("4 task started")
        await asyncio.sleep(0)
        print("6 task resumed after await")

    task = asyncio.create_task(run())
    print("2 sync end")
    await asyncio.sleep(0.01)
    await task

asyncio.run(main())`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `- **\`setTimeout(fn, 0)\` ko "turant" samajhna**: yeh sync code aur saare microtasks ke **baad** chalta hai.
- **Promise ko timer se pehle "kabhi kabhi" samajhna**: nahi, **hamesha** pehle. Microtasks poore khaali hote hain, phir ek macrotask.
- **Main thread block karna**: 2 second ka \`for\` loop, bada sync JSON parse, ya \`while (Date.now() < end) {}\` "sleep". Is dauraan na click, na render, na timers. Node mein saare requests atak jaate hain.
- **Infinite microtasks**: \`function loop() { Promise.resolve().then(loop) }\` — macrotasks aur rendering kabhi nahi aate, tab freeze. setTimeout wala recursive loop kam se kam UI ko saans leta deta hai.
- **setTimeout ke delay ko exact time samajhna**: \`setTimeout(fn, 1000)\` = "kam se kam 1000ms", busy thread pe zyada. Countdown timers mein drift aata hai; \`Date.now()\` se actual time calculate karo.
- **\`await\` ko "thread sleep" samajhna**: await sirf function ko pause karta hai, loop chalta rehta hai.
- **Node mein \`process.nextTick\` overuse**: yeh promises se bhi pehle chalta hai aur I/O ko starve kar sakta hai.`,
          en: `- Thinking \`setTimeout(fn, 0)\` is immediate.
- Thinking promises only sometimes beat timers; microtasks always drain first.
- Blocking the main thread with long loops, big sync parsing or busy-wait "sleeps".
- Infinite microtask loops that starve rendering and timers.
- Treating timer delays as exact; compute elapsed time with \`Date.now()\`.
- Thinking \`await\` sleeps the thread.
- Overusing \`process.nextTick\` in Node, which can starve I/O.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Event loop se jude problems ko debug karna:

1. **Order confuse kar raha hai?** Har callback mein label ke saath log lagao (\`"micro A"\`, \`"timer B"\`) aur paper pe 4 boxes banao: Stack, Web APIs, Microtasks, Macrotasks. Code line by line chala ke boxes update karo. Interview mein bhi yahi trick.
2. **Page freeze / janky scroll**: Chrome DevTools → **Performance** tab → Record → action karo → Stop. Laal kone wale **"Long task"** blocks dekho; uske andar flame chart batata hai kaunsa function time kha raha hai.
3. **Node server slow under load**: event loop lag measure karo (\`perf_hooks.monitorEventLoopDelay()\`), ya \`clinic doctor\` / \`--prof\` se profile karo. Sync crypto, \`fs.readFileSync\`, bade JSON operations dhundho.
4. **Timer late chal raha hai**: matlab thread busy tha. Timer ke callback mein \`Date.now() - scheduledAt\` log karo, aur us samay chal rahe code ko Performance tab se dekho.
5. **"Uncaught (in promise)"** errors microtasks se aate hain; DevTools mein "Pause on exceptions" on karo.`,
          en: `1. Label every callback and trace on paper with four boxes: Stack, Web APIs, Microtasks, Macrotasks.
2. For freezes, record in the DevTools **Performance** tab and inspect **Long tasks** in the flame chart.
3. For slow Node servers, measure event-loop delay with \`perf_hooks.monitorEventLoopDelay()\` or profile with clinic; look for sync crypto, \`readFileSync\` and huge JSON work.
4. Late timers mean a busy thread; log the actual delay.
5. Enable "Pause on exceptions" for "Uncaught (in promise)" errors.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `- **Single thread + event loop vs multi-threading**: fayda: simple mental model, locks nahi, I/O-heavy kaam (APIs, chat servers) mein bahut efficient. Nuksan: CPU-heavy kaam (image processing, video encoding, bade calculations) thread ko block karta hai.
- **CPU-heavy kaam ke options**: browser mein **Web Workers**, Node mein **worker_threads** ya alag service/queue (jaise BullMQ job). Ya kaam ko chhote chunks mein todo aur beech mein \`setTimeout\`/\`setImmediate\` se loop ko saans do.
- **Microtask vs macrotask scheduling**: \`queueMicrotask\` "isi tick ke end mein, render se pehle" ke liye (state consistent rakhna). \`setTimeout\` "baad mein, render hone do" ke liye. Animation ke liye \`requestAnimationFrame\`.
- **Python/Go comparison**: Python ka asyncio bhi event loop hai (same strengths/limits). Go goroutines aur Java threads CPU-heavy parallel kaam mein aage, lekin unke saath shared memory ki complexity aati hai.`,
          en: `- **Event loop vs multi-threading**: simple model, no locks, excellent for I/O-heavy servers; poor for CPU-heavy work, which blocks the thread.
- **For CPU-heavy work** use Web Workers, Node \`worker_threads\`, a separate job queue, or split work into chunks.
- **Scheduling choices**: \`queueMicrotask\` before rendering, \`setTimeout\` to let the browser render, \`requestAnimationFrame\` for animation.
- Python's asyncio shares the same trade-offs; Go and Java threads handle CPU parallelism better but bring shared-memory complexity.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real incident jaisa example: ek Node.js API mein report export endpoint tha jo 2 lakh rows ka CSV **synchronously** banata tha (~3 second). Jab bhi koi admin export dabata, **saare users** ke login aur orders 3 second ke liye atak jaate. Monitoring mein p99 latency spike dikhi.

Fix ke steps:
1. Event loop delay metric (\`monitorEventLoopDelay\`) dashboard pe daala, spike export ke time match hua.
2. Export ko **background job queue** (BullMQ + Redis) mein bheja; API turant \`202 Accepted\` + job id return karti hai.
3. Worker process CSV ko stream karke chunks mein likhta hai, aur ready hone pe email/notification.

Frontend pe bhi same soch: bade list ka filter Web Worker mein, aur search ke liye debounce. Code review mein sync file reads (\`readFileSync\`) request handlers ke andar, bade \`JSON.parse\`, aur CPU-heavy loops turant flag hote hain.`,
          en: `A realistic incident: a Node.js endpoint built a 200,000-row CSV synchronously (~3s), freezing logins and orders for **every** user whenever an admin exported. Event-loop delay metrics matched the p99 latency spikes.

The fix moved the export to a **background job queue** (BullMQ + Redis); the API returns \`202 Accepted\` with a job id, and a worker streams the CSV in chunks and notifies when ready.

Frontends apply the same idea with Web Workers and debouncing. Reviewers flag \`readFileSync\` in handlers, huge \`JSON.parse\` calls and CPU-heavy loops.`,
        },
      },
    ],
    visualization: {
      kind: "QUEUE",
      title: "Event loop: call stack, Web APIs, microtasks, macrotasks",
      steps: [
        { title: "Call stack: sync code", description: "console.log('1') call stack pe chala aur print hua. Script khud pehla macrotask hai.", highlight: "Call stack: log('1')" },
        { title: "Web API: setTimeout", description: "setTimeout(cb, 0) ne timer Web API ko diya. 0ms baad cb macrotask queue mein chala gaya, lekin abhi chalega nahi.", highlight: "Macrotask queue: [timeout cb]" },
        { title: "Microtask queue: .then", description: "Promise.resolve().then(cb2) — promise already resolved hai, toh cb2 seedha microtask queue mein.", highlight: "Microtask queue: [then cb2]" },
        { title: "Stack khaali", description: "console.log('4') bhi chal gaya. Script khatam, call stack empty. Ab event loop ka turn.", highlight: "Call stack: []" },
        { title: "Microtasks drain", description: "Event loop pehle microtask queue poori khaali karta hai: cb2 chala, '3' print hua. Agar cb2 ne naya microtask daala hota toh woh bhi abhi chalta.", highlight: "Run: then cb2 → '3'" },
        { title: "Ek macrotask", description: "Ab macrotask queue se timeout cb uthaya, '2' print hua. Output: 1, 4, 3, 2.", highlight: "Run: timeout cb → '2'" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which queue does a Promise `.then` callback go into?",
        options: ["Macrotask (task) queue", "Microtask queue", "Directly onto the call stack", "The render queue"],
        correct: [1],
        explanation: "Promise reactions (`.then/.catch/.finally`) aur `await` ke baad ka code **microtask queue** mein jaate hain. setTimeout callbacks macrotask queue mein.",
        tags: ["queues"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "When the call stack becomes empty, what does the event loop do first?",
        options: [
          "Runs one macrotask, then one microtask",
          "Runs all pending microtasks, then takes one macrotask",
          "Runs all macrotasks, then all microtasks",
          "Waits for the next user click",
        ],
        correct: [1],
        explanation: "Rule: stack khaali → **saare** microtasks (naye aaye hue bhi) → phir **ek** macrotask → phir microtasks dobara.",
        tags: ["event-loop"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Why might `setTimeout(fn, 1000)` run after 1500ms?",
        options: [
          "Timers are random in JavaScript",
          "The delay is a minimum; fn runs only when the call stack is free and microtasks are done",
          "setTimeout always adds 500ms",
          "The browser rounds timers to the nearest second",
        ],
        correct: [1],
        explanation: "1000ms ke baad fn sirf queue mein jaata hai. Agar main thread kisi heavy kaam mein busy hai, toh fn tab tak wait karega. Delay minimum hai, guarantee nahi.",
        tags: ["timers"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these schedule a MICROtask? (Select all that apply)",
        options: ["Promise.resolve().then(fn)", "setTimeout(fn, 0)", "queueMicrotask(fn)", "Code after await inside an async function", "A button click handler"],
        correct: [0, 2, 3],
        explanation: "then, queueMicrotask aur await ke baad ka code microtasks hain. setTimeout aur click events macrotasks (tasks) hain.",
        tags: ["queues"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");`,
        codeLanguage: "javascript",
        options: ["1\n2\n3\n4", "1\n4\n2\n3", "1\n4\n3\n2", "1\n3\n4\n2"],
        correct: [2],
        explanation: "Sync pehle: 1, 4. Phir stack khaali → microtasks: 3. Phir macrotask (timeout): 2. Promise ka then hamesha setTimeout(0) se pehle.",
        tags: ["ordering"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 3,
        prompt: "What does this code print?",
        code: `setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => {
  console.log("micro 1");
  Promise.resolve().then(() => console.log("micro 2"));
});
queueMicrotask(() => console.log("micro 3"));
console.log("sync");`,
        codeLanguage: "javascript",
        options: [
          "sync\nmicro 1\nmicro 2\nmicro 3\ntimeout",
          "sync\nmicro 1\nmicro 3\nmicro 2\ntimeout",
          "sync\nmicro 1\nmicro 3\ntimeout\nmicro 2",
          "micro 1\nmicro 3\nsync\nmicro 2\ntimeout",
        ],
        correct: [1],
        explanation: "Sync: \"sync\". Microtask queue mein pehle se [micro 1, micro 3]. micro 1 chalte waqt micro 2 queue ke **end** mein judta hai: [micro 3, micro 2]. Saare microtasks khatam hone ke baad hi timeout.",
        tags: ["ordering", "nested-microtask"],
      },
      {
        type: "SCENARIO",
        difficulty: 3,
        prompt: "In a Node.js API, one endpoint runs a 3-second synchronous loop to build a report. During that time, all other users' requests hang. What is the best fix?",
        options: [
          "Wrap the loop in an async function",
          "Move the heavy work to a worker thread or background job queue so the event loop stays free",
          "Add await before the loop",
          "Use setTimeout(loop, 0)",
        ],
        correct: [1],
        explanation: "Sync CPU kaam single thread ko block karta hai; async lagane ya await se kuch nahi badalta, aur setTimeout sirf usse thoda baad mein chalayega, block phir bhi hoga. worker_threads ya job queue mein bhejo.",
        tags: ["blocking"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order one turn of the browser event loop.",
        options: [
          "Take one task from the macrotask queue and run it until the call stack is empty",
          "Run every microtask in the microtask queue, including newly added ones",
          "Give the browser a chance to render (rAF, layout, paint)",
          "Go back and pick the next macrotask",
        ],
        explanation: "Ek macrotask → poori microtask queue → rendering ka mauka → agla macrotask. Isliye lambe microtask chains rendering ko rok sakti hain.",
        tags: ["event-loop"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain why `setTimeout(fn, 0)` does not run fn immediately, using the terms call stack and queues.",
        keywords: ["macrotask queue", "call stack empty", "microtasks first", "minimum delay", "event loop"],
        explanation: "setTimeout fn ko timer API ko deta hai; 0ms baad fn macrotask queue mein jaata hai. Event loop use tabhi uthata hai jab call stack khaali ho aur saare microtasks khatam ho jaayein. Toh delay sirf minimum hai.",
        tags: ["timers"],
      },
    ],
    buildTask: {
      title: "Predict the event loop order",
      description: `Ek simplified event loop simulator banao! Function \`eventLoopOrder(tasks)\` ko ek list milegi jo batati hai code mein kya-kya schedule hua, **jis order mein likha gaya**:

- \`{ "type": "sync", "label": "A" }\` — seedha call stack pe chalta hai
- \`{ "type": "micro", "label": "B" }\` — Promise.then / queueMicrotask
- \`{ "type": "macro", "label": "C", "delay": 10 }\` — setTimeout (delay na ho toh 0)

Return karo labels ka array, **jis order mein print honge**:
1. Saare \`sync\` (likhe gaye order mein)
2. Phir saare \`micro\` (likhe gaye order mein)
3. Phir saare \`macro\`, **delay ke ascending order** mein; same delay ho toh likhe gaye order mein

Example: \`[sync A, macro B, micro C, sync D]\` → \`["A", "D", "C", "B"]\``,
      functionName: "eventLoopOrder",
      starterJs: `function eventLoopOrder(tasks) {
  // sync first, then micro, then macro by delay
  return [];
}`,
      starterPython: `def eventLoopOrder(tasks):
    # sync first, then micro, then macro by delay
    return []`,
      tests: [
        {
          name: "classic 1-4-3-2",
          args: [[{ type: "sync", label: "A" }, { type: "macro", label: "B" }, { type: "micro", label: "C" }, { type: "sync", label: "D" }]],
          expected: ["A", "D", "C", "B"],
        },
        { name: "nothing scheduled", args: [[]], expected: [] },
        {
          name: "timers sorted by delay",
          args: [[{ type: "macro", label: "T100", delay: 100 }, { type: "macro", label: "T0", delay: 0 }, { type: "micro", label: "M" }]],
          expected: ["M", "T0", "T100"],
        },
        {
          name: "only sync",
          args: [[{ type: "sync", label: "x" }, { type: "sync", label: "y" }]],
          expected: ["x", "y"],
        },
        {
          name: "same delay keeps written order",
          args: [[{ type: "macro", label: "X", delay: 10 }, { type: "macro", label: "Y", delay: 10 }, { type: "macro", label: "Z", delay: 5 }]],
          expected: ["Z", "X", "Y"],
          hidden: true,
        },
        {
          name: "full mix with missing delay",
          args: [[
            { type: "macro", label: "t1", delay: 20 },
            { type: "micro", label: "m1" },
            { type: "sync", label: "s1" },
            { type: "macro", label: "t0" },
            { type: "micro", label: "m2" },
            { type: "sync", label: "s2" },
          ]],
          expected: ["s1", "s2", "m1", "m2", "t0", "t1"],
          hidden: true,
        },
      ],
      hints: [
        "Teen buckets socho: call stack (sync), microtask queue, macrotask queue. Event loop pehle stack, phir saare microtasks, phir timers.",
        "Teen alag lists banao filter se. Macro list ko delay (default 0) se sort karo; JS ka sort stable hai toh same delay pe order bana rahega.",
        "const macro = tasks.filter(t => t.type === 'macro').sort((a, b) => (a.delay ?? 0) - (b.delay ?? 0));  // Python: sorted(..., key=lambda t: t.get('delay', 0))",
      ],
      explainQuestions: [
        { question: "Why do all microtasks come before any macrotask in your output?", keywords: ["microtask queue", "drained first", "event loop", "priority"] },
        { question: "Why must the sort of timers be stable?", keywords: ["same delay", "written order", "stable sort"] },
        { question: "What real-world detail does this simulator ignore?", keywords: ["nested microtasks", "rendering", "busy thread", "delay minimum"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "Explain the JavaScript event loop.",
        short: "JavaScript runs on a single call stack. Async work like timers and network is handed to browser or Node APIs, and their callbacks are queued when ready. Whenever the call stack is empty, the event loop first drains the entire microtask queue, which holds promise callbacks, then takes one macrotask such as a timer or click event, lets the browser render if needed, and repeats.",
        deep: `- **Call stack**: synchronous execution; nothing interrupts a running function.
- **Web/Node APIs**: timers, fetch/I-O, DOM events run outside JS.
- **Microtasks**: \`then/catch/finally\`, post-\`await\` code, \`queueMicrotask\`, \`MutationObserver\`. Drained completely after each task.
- **Macrotasks**: \`setTimeout\`, \`setInterval\`, events, I/O, \`MessageChannel\`.
- **Rendering** happens between tasks; long tasks (>50ms) cause jank.
- **Node.js**: libuv phases (timers → poll → check → close); \`process.nextTick\` runs before promise microtasks; \`setImmediate\` runs in the check phase.`,
        followUps: [
          "What is the output order of setTimeout 0 vs Promise.then and why?",
          "How can microtasks starve rendering?",
          "How does the Node.js event loop differ from the browser's?",
        ],
        commonMistake: "Saying JavaScript runs async callbacks in parallel threads, or that setTimeout 0 runs immediately.",
        keywords: ["call stack", "microtask queue", "macrotask queue", "web apis", "single-threaded"],
        difficulty: 3,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND", "SDE"],
      },
      {
        question: "If Node.js is single-threaded, how does it handle thousands of concurrent requests?",
        short: "Node runs JavaScript on one thread, but I/O like database queries, network and file access is non-blocking: it is delegated to the operating system or libuv's thread pool, and the callback is queued when the result is ready. Since most server time is spent waiting on I/O, one thread can juggle thousands of connections. The catch is CPU-heavy synchronous code, which blocks everyone and should go to worker threads or a job queue.",
        deep: `- Network I/O uses OS async mechanisms (epoll, kqueue, IOCP); file system and crypto use libuv's thread pool (default 4).
- Throughput is excellent for I/O-bound APIs, chat and streaming.
- Blocking examples: \`readFileSync\`, sync bcrypt, giant \`JSON.parse\`, tight loops.
- Monitor with event-loop delay metrics; scale with clustering/multiple processes and worker_threads.`,
        followUps: ["What is libuv's thread pool used for?", "How would you detect event loop blocking in production?"],
        commonMistake: "Claiming Node is fully single-threaded internally, ignoring libuv's thread pool and OS async I/O.",
        keywords: ["non-blocking i/o", "libuv", "thread pool", "event loop", "cpu-bound"],
        difficulty: 3,
        roles: ["BACKEND", "FULLSTACK", "SDE"],
      },
    ],
    promptCard: {
      title: "Practice event loop output questions",
      category: "INTERVIEW",
      task: "Generate event-loop output-prediction questions at your level and get step-by-step queue traces for the answers.",
      whenToUse: "Interview se pehle jab setTimeout vs Promise vs async/await output questions practice karne hon aur har answer ka queue-by-queue reason samajhna ho.",
      template: `Act as a JavaScript interviewer.

Give me [NUMBER_OF_QUESTIONS] "predict the output" questions about the event loop at [LEVEL] level.
Use only: console.log, setTimeout, Promise.resolve().then, queueMicrotask, async/await. Environment: [RUNTIME].

For each question:
1. Show the code only and wait for my answer before revealing anything.
2. After I answer, show a trace table with columns: Step | Call stack | Microtask queue | Macrotask queue | Printed so far.
3. State the final output and point out the exact rule I got wrong, if any.
Do not use network calls or random delays, so the output is deterministic.`,
      variables: [
        { key: "NUMBER_OF_QUESTIONS", label: "How many questions (e.g. 3)" },
        { key: "LEVEL", label: "beginner / intermediate / advanced" },
        { key: "RUNTIME", label: "Browser or Node.js version" },
      ],
      whyItWorks: [
        { part: "Wait for my answer", why: "Pehle khud socho, phir answer dekho; isse active recall hota hai aur interview jaisa pressure bhi." },
        { part: "Trace table with queues", why: "Har step pe stack aur dono queues dikhne se rule (microtasks first) dimaag mein baith jaata hai." },
        { part: "Deterministic, no network", why: "Output fix rehta hai, toh tum node mein chala ke AI ka answer verify kar sakte ho." },
      ],
      verifyChecklist: [
        "Har question ka code node mein chala ke AI ke output se match karo.",
        "Agar Node aur browser alag result dein (jaise setImmediate), toh runtime confirm karo.",
        "Trace table mein har microtask ke andar se naya microtask sahi jagah (queue ke end) pe juda hai, check karo.",
      ],
      sampleOutput: `Q1:
console.log("A"); setTimeout(() => console.log("B")); Promise.resolve().then(() => console.log("C")); console.log("D");

(after your answer)
Step | Stack | Micro | Macro | Printed
1 | log A | – | – | A
2 | setTimeout | – | [B] | A
3 | then | [C] | [B] | A
4 | log D | [C] | [B] | A D
5 | (empty) run micro | – | [B] | A D C
6 | run macro | – | – | A D C B
Rule: microtasks drain before the next macrotask.`,
    },
  },
];
