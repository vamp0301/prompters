import type { SeedTopicContent } from "./types.js";

/**
 * Stage 0 — Foundations.
 * Hinglish is the primary teaching language; `en` is simple English; `hi` only for DEFINITION and ANALOGY.
 */
export const topics: SeedTopicContent[] = [
  // ───────────────────────────── binary-bits-bytes ─────────────────────────────
  {
    slug: "binary-bits-bytes",
    estMinutes: 20,
    difficulty: 1,
    prerequisites: [],
    objectives: [
      "Explain what a bit and a byte are, and why computers use only 0 and 1",
      "Convert small numbers between decimal and binary by hand",
      "Understand units like KB, MB, GB and the difference between bits and bytes",
      "See how text and numbers are stored as binary inside a computer",
    ],
    technicalDefinition:
      "Binary is the base-2 positional number system using digits 0 and 1; a bit is a single binary digit and a byte is a group of 8 bits, the basic addressable unit of memory in most computers.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Binary** ek number system hai jisme sirf do digits hote hain: \`0\` aur \`1\`. Computer ke andar sab kuch — numbers, text, photos, songs, Instagram reels — aakhir mein 0 aur 1 ke form mein hi store hota hai.

- **Bit** = ek single 0 ya 1. Ye computer ka sabse chhota unit hai.
- **Byte** = 8 bits ka ek group, jaise \`01000001\`.

Ek byte mein 2^8 = **256** alag patterns ban sakte hain (0 se 255 tak). Isliye ek byte mein ek English letter ya 0–255 tak ka number aaram se fit ho jaata hai. Baaki units — KB, MB, GB — bas bytes ke bade bundles hain.`,
          en: `**Binary** is a number system with only two digits: \`0\` and \`1\`. Inside a computer, everything — numbers, text, photos, songs, videos — is finally stored as 0s and 1s.

- A **bit** is a single 0 or 1. It is the smallest unit of data.
- A **byte** is a group of 8 bits, like \`01000001\`.

One byte can hold 2^8 = **256** different patterns (0 to 255). That is enough for one English letter or a small number. Bigger units like KB, MB and GB are just large bundles of bytes.`,
          hi: `**बाइनरी** एक ऐसी संख्या प्रणाली है जिसमें सिर्फ़ दो अंक होते हैं: \`0\` और \`1\`। कंप्यूटर के अंदर सब कुछ — संख्याएँ, टेक्स्ट, फ़ोटो, गाने — आख़िर में 0 और 1 के रूप में ही रखा जाता है।

- **बिट** = एक अकेला 0 या 1। यह डेटा की सबसे छोटी इकाई है।
- **बाइट** = 8 बिट्स का एक समूह, जैसे \`01000001\`।

एक बाइट में 256 अलग पैटर्न बन सकते हैं (0 से 255 तक)। इसलिए एक बाइट में एक अंग्रेज़ी अक्षर या छोटी संख्या आ जाती है। KB, MB, GB बस बाइट्स के बड़े समूह हैं।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Socho tumhare ghar mein ek **light switch** hai. Uski sirf do states hain: **ON** ya **OFF**. Ek switch = ek **bit**.

Ab socho tumhare kamre mein ek line mein **8 switches** lage hain. Har switch ON/OFF ho sakta hai, toh total combinations = 2 × 2 × 2 ... (8 baar) = **256**. Ye 8 switches ka board = ek **byte**.

Agar tum aur tumhara dost ek code decide kar lo — "pehla aur aakhri switch ON matlab *chai le aao*" — toh sirf switches se tum message bhej sakte ho. Computer bhi exactly yahi karta hai: har pattern ka ek matlab fix hai. Jaise \`01000001\` ka matlab hai letter **A**. Railway ke signal bhi aise hi kaam karte hain — limited states, par fixed matlab.`,
          en: `Imagine a **light switch** at home. It has only two states: **ON** or **OFF**. One switch is like one **bit**.

Now imagine a row of **8 switches** on a board. Each can be ON or OFF, so the total number of combinations is 2 × 2 × 2 ... (8 times) = **256**. This board of 8 switches is like one **byte**.

If you and a friend agree on a code — "first and last switch ON means *bring tea*" — you can send messages using only switches. A computer does exactly this: each pattern has a fixed meaning. For example, \`01000001\` means the letter **A**.`,
          hi: `सोचो तुम्हारे घर में एक **लाइट स्विच** है। उसकी सिर्फ़ दो हालतें हैं: **ON** या **OFF**। एक स्विच = एक **बिट**।

अब सोचो एक बोर्ड पर **8 स्विच** एक लाइन में लगे हैं। हर स्विच ON या OFF हो सकता है, तो कुल मिलाकर **256** तरह के पैटर्न बनते हैं। यह 8 स्विच वाला बोर्ड = एक **बाइट**।

अगर तुम और तुम्हारा दोस्त तय कर लो कि किस पैटर्न का क्या मतलब है, तो सिर्फ़ स्विच से संदेश भेज सकते हो। कंप्यूटर भी यही करता है — जैसे \`01000001\` का मतलब है अक्षर **A**।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Computer ke andar crores **transistors** hote hain — chhote electronic switches. Ek transistor ke liye do states pehchaanna bahut easy aur reliable hai: **current hai (1)** ya **current nahi hai (0)**.

Agar hum decimal (0–9) use karte, toh har wire mein 10 alag voltage levels pehchaanne padte. Thoda sa bhi noise aaya — jaise garmi ya bijli ka fluctuation — toh 6 ko 7 samajh liya jaata. Gadbad!

Do states ke saath galti ka chance bahut kam hai. Isliye:

- Hardware simple aur sasta banta hai
- Data reliable rehta hai
- Boolean logic (AND, OR, NOT) seedha 0/1 par kaam karta hai

Bina binary samjhe tum ye nahi samajh paoge ki "100 Mbps" plan pe 100 MB file 1 second mein kyun nahi aati, ya integer overflow kyun hota hai.`,
          en: `A computer has billions of **transistors** — tiny electronic switches. It is easy and reliable for a transistor to show two states: **current flowing (1)** or **no current (0)**.

If computers used decimal (0–9), every wire would need 10 different voltage levels. A little electrical noise could turn a 6 into a 7. That would cause errors.

With only two states, mistakes are rare. So:

- Hardware stays simple and cheap
- Data stays reliable
- Boolean logic (AND, OR, NOT) works directly on 0 and 1

Without binary, you cannot understand why a "100 Mbps" plan does not download 100 MB in one second, or why integer overflow happens.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Binary har jagah hai, bas dikhta nahi:

- **Jio / Airtel internet plans**: speed **Mbps** (mega*bits* per second) mein batate hain, jabki file size **MB** (mega*bytes*) mein hota hai. 1 byte = 8 bits, isliye 100 Mbps pe 100 MB file ko ~8 second lagte hain.
- **WhatsApp / Instagram**: photo bhejne se pehle compress karte hain taaki bytes kam ho jaayein — kam bytes = kam data aur fast upload.
- **UPI / Paytm apps**: amounts aur IDs memory mein fixed-size binary integers ki tarah store hote hain. Developer ko pata hona chahiye ki 32-bit integer ki limit kya hai, warna bade amounts pe bug aa sakta hai.

Har image ka pixel bhi bytes hai: ek RGB pixel = 3 bytes (red, green, blue, har ek 0–255).`,
          en: `Binary is everywhere, even if you do not see it:

- **Jio / Airtel internet plans** show speed in **Mbps** (mega*bits* per second), but file sizes are in **MB** (mega*bytes*). Since 1 byte = 8 bits, a 100 MB file takes about 8 seconds on a 100 Mbps plan.
- **WhatsApp / Instagram** compress photos before sending, so they use fewer bytes. Fewer bytes means less data and faster uploads.
- **UPI / Paytm apps** store amounts and IDs as fixed-size binary integers. Developers must know the limits of a 32-bit integer, or large values can cause bugs.

Even each image pixel is bytes: one RGB pixel = 3 bytes (red, green, blue, each 0–255).`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Binary bhi decimal jaisa hi **place value** system hai, bas base 10 ki jagah base 2.

Decimal mein \`345\` = 3×100 + 4×10 + 5×1. Binary mein har position ki value double hoti jaati hai: 1, 2, 4, 8, 16, 32, 64, 128.

Example: \`1101\` = 1×8 + 1×4 + 0×2 + 1×1 = **13**.

**Decimal → binary** karne ka tareeka: number ko baar baar 2 se divide karo, remainders likhte jao, aur end mein unhe **neeche se upar** padho.

13 ÷ 2 = 6 r **1**, 6 ÷ 2 = 3 r **0**, 3 ÷ 2 = 1 r **1**, 1 ÷ 2 = 0 r **1** → \`1101\`.

**Text** ke liye ek table hai (ASCII / Unicode): 'A' = 65 = \`01000001\`. UTF-8 mein English letter 1 byte leta hai, Hindi akshar jaise 'क' 3 bytes, aur emoji 4 bytes.`,
          en: `Binary is a **place value** system just like decimal, but with base 2 instead of base 10.

In decimal, \`345\` = 3×100 + 4×10 + 5×1. In binary, each position doubles: 1, 2, 4, 8, 16, 32, 64, 128.

Example: \`1101\` = 1×8 + 1×4 + 0×2 + 1×1 = **13**.

To convert **decimal → binary**: keep dividing by 2, write down the remainders, then read them **from bottom to top**.

13 ÷ 2 = 6 r **1**, 6 ÷ 2 = 3 r **0**, 3 ÷ 2 = 1 r **1**, 1 ÷ 2 = 0 r **1** → \`1101\`.

For **text**, there is a lookup table (ASCII / Unicode): 'A' = 65 = \`01000001\`. In UTF-8, an English letter takes 1 byte, a Hindi letter like 'क' takes 3 bytes, and an emoji takes 4.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Ye program binary string ko decimal mein badalta hai aur letter ka binary dikhata hai.

1. \`binaryToDecimal\` mein \`value\` 0 se shuru hota hai.
2. Har bit ke liye: purani value ko 2 se multiply karo (ek position left shift) aur naya bit add karo. "1101" ke liye: 1 → 3 → 6 → 13.
3. \`parseInt("1101", 2)\` / \`int("1101", 2)\` built-in tareeka hai — result same aana chahiye.
4. \`charCodeAt\` / \`ord\` letter ka number deta hai (A = 65).
5. \`toString(2)\` / \`format(code, "08b")\` us number ko 8-bit binary mein dikhata hai.
6. Last line batati hai ek byte mein kitne patterns possible hain: 2^8 = 256.

Run karke dekho, phir "11111111" ki jagah apna pattern daalo.`,
          en: `This program converts a binary string to decimal and shows the binary form of a letter.

1. In \`binaryToDecimal\`, \`value\` starts at 0.
2. For each bit: multiply the old value by 2 (shift one place left) and add the new bit. For "1101": 1 → 3 → 6 → 13.
3. \`parseInt("1101", 2)\` / \`int("1101", 2)\` is the built-in way — the result should match.
4. \`charCodeAt\` / \`ord\` gives the number for a letter (A = 65).
5. \`toString(2)\` / \`format(code, "08b")\` shows that number as 8-bit binary.
6. The last line shows how many patterns fit in one byte: 2^8 = 256.`,
        },
        codeJs: `// Binary string -> decimal number, step by step
function binaryToDecimal(bits) {
  let value = 0;
  for (const bit of bits) {
    value = value * 2 + Number(bit);
  }
  return value;
}

console.log("1101 ->", binaryToDecimal("1101"));
console.log("11111111 ->", binaryToDecimal("11111111"));
console.log("Built-in check:", parseInt("1101", 2));

const letter = "A";
const code = letter.charCodeAt(0);
console.log(letter, "code =", code, "binary =", code.toString(2).padStart(8, "0"));
console.log("Patterns in 1 byte:", 2 ** 8);
`,
        codePython: `# Binary string -> decimal number, step by step
def binary_to_decimal(bits):
    value = 0
    for bit in bits:
        value = value * 2 + int(bit)
    return value


print("1101 ->", binary_to_decimal("1101"))
print("11111111 ->", binary_to_decimal("11111111"))
print("Built-in check:", int("1101", 2))

letter = "A"
code = ord(letter)
print(letter, "code =", code, "binary =", format(code, "08b"))
print("Patterns in 1 byte:", 2 ** 8)
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Beginners ye galtiyan bahut karte hain:

- **Mb aur MB ko same samajhna.** Chhota \`b\` = bit, bada \`B\` = byte. 100 Mbps ≈ 12.5 MB per second.
- **Binary ko upar se padhna.** Division method mein remainders ko **neeche se upar** padhna hai. 6 ka binary \`110\` hai, \`011\` nahi.
- **"1 byte mein max 256" bolna.** Patterns 256 hain, par max value **255** hai, kyunki counting 0 se shuru hoti hai.
- **Binary \`10\` ko das samajhna.** Binary \`10\` = decimal **2**. Isliye joke hai: "duniya mein 10 type ke log hain..."
- **Socho ki har character 1 byte hai.** UTF-8 mein emoji 4 bytes leta hai, Hindi akshar 3 bytes. String length aur byte size alag ho sakte hain.`,
          en: `Common beginner mistakes:

- **Treating Mb and MB as the same.** Small \`b\` = bit, capital \`B\` = byte. 100 Mbps is about 12.5 MB per second.
- **Reading remainders top to bottom.** In the division method, read them **bottom to top**. 6 is \`110\`, not \`011\`.
- **Saying the max value of a byte is 256.** There are 256 patterns, but the max value is **255**, because counting starts at 0.
- **Reading binary \`10\` as ten.** Binary \`10\` is decimal **2**.
- **Assuming every character is 1 byte.** In UTF-8, an emoji takes 4 bytes and a Hindi letter takes 3. String length and byte size can differ.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Jab binary ya bytes se related bug aaye, toh aise check karo:

1. **Units check karo.** Logs mein file size bytes mein hai ya KB mein? Speed bits mein hai ya bytes mein? 8 ka factor miss hona bahut common hai.
2. **Chhote example se test karo.** Pehle 5, 6, 13 jaise numbers pe haath se calculate karo, phir code se compare karo.
3. **Built-in se cross-check.** JS mein \`(13).toString(2)\` aur \`parseInt("1101", 2)\`, Python mein \`bin(13)\` aur \`int("1101", 2)\`.
4. **String ka byte size dekho.** JS: \`new TextEncoder().encode("नमस्ते").length\`, Python: \`len("नमस्ते".encode("utf-8"))\`. Agar database column "too long" error de raha hai, toh shayad characters kam hain par bytes zyada.
5. **Overflow suspect karo** jab bada number achanak negative ya chhota ho jaaye.`,
          en: `When you hit a bug related to binary or bytes, check this:

1. **Check units.** Is the file size in bytes or KB? Is the speed in bits or bytes? Missing a factor of 8 is very common.
2. **Test with small examples.** Calculate 5, 6 or 13 by hand first, then compare with your code.
3. **Cross-check with built-ins.** JS: \`(13).toString(2)\` and \`parseInt("1101", 2)\`. Python: \`bin(13)\` and \`int("1101", 2)\`.
4. **Check the byte size of a string.** JS: \`new TextEncoder().encode("नमस्ते").length\`. Python: \`len("नमस्ते".encode("utf-8"))\`. A "too long" database error may mean few characters but many bytes.
5. **Suspect overflow** when a big number suddenly becomes negative or small.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Binary computer ke liye best hai, par insaan ke liye padhna mushkil. Isliye hum alag representations use karte hain:

- **Hexadecimal (base 16)**: ek hex digit = 4 bits. \`11111111\` ko \`FF\` likh sakte ho. Colors (\`#FF5733\`), memory addresses, aur git commit IDs hex mein hote hain.
- **Decimal**: insaano ke liye — bills, marks, UI mein numbers.
- **Text formats (JSON, CSV)**: padhne mein easy, par binary formats se zyada bytes lete hain.
- **Binary formats (images, Protobuf)**: chhote aur fast, par seedha padh nahi sakte.

Trade-off simple hai: **readability vs size/speed**. Debugging ke time readable format, high-traffic systems mein compact binary format. Roz ke code mein tumhe khud binary likhna kam padega — language ye kaam karti hai.`,
          en: `Binary is perfect for computers but hard for humans to read. So we use other representations:

- **Hexadecimal (base 16)**: one hex digit = 4 bits. \`11111111\` can be written as \`FF\`. Colors (\`#FF5733\`), memory addresses and git commit IDs use hex.
- **Decimal**: for humans — bills, marks, numbers in a UI.
- **Text formats (JSON, CSV)**: easy to read, but they use more bytes than binary formats.
- **Binary formats (images, Protobuf)**: small and fast, but not human-readable.

The trade-off is **readability vs size and speed**. Use readable formats while debugging, and compact binary formats in high-traffic systems.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Maan lo tum ek **college notes sharing app** bana rahe ho jahan students PDFs upload karte hain.

- Upload limit set karni hai: "max 10 MB". Code mein ye \`10 * 1024 * 1024\` bytes hoga. Agar galti se \`10 * 1000\` likh diya, toh sirf 10 KB allow hoga aur sab uploads fail!
- UI mein size dikhana hai: \`2516582\` bytes ko "2.4 MB" mein badalna padega.
- Students Hindi mein titles likhenge — database column ki limit characters mein hai ya bytes mein, ye check karna padega.
- Profile picture ko resize karke kam bytes mein save karoge taaki app fast chale aur cloud storage ka bill kam aaye.

Yani bits aur bytes ki samajh seedha tumhare app ke **performance, cost aur bugs** pe asar daalti hai.`,
          en: `Say you are building a **college notes sharing app** where students upload PDFs.

- You set an upload limit of "max 10 MB". In code, that is \`10 * 1024 * 1024\` bytes. If you write \`10 * 1000\` by mistake, only 10 KB is allowed and every upload fails.
- The UI must show sizes: \`2516582\` bytes should become "2.4 MB".
- Students write titles in Hindi, so you must check if the database limit counts characters or bytes.
- You resize profile pictures to use fewer bytes, so the app is faster and cloud storage costs less.

Understanding bits and bytes directly affects your app's **performance, cost and bugs**.`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "Decimal 13 ko binary mein badalna",
      steps: [
        { title: "13 ÷ 2", description: "Quotient 6, remainder 1. Remainder ko side mein likh lo.", highlight: "1" },
        { title: "6 ÷ 2", description: "Quotient 3, remainder 0.", highlight: "0" },
        { title: "3 ÷ 2", description: "Quotient 1, remainder 1.", highlight: "1" },
        { title: "1 ÷ 2", description: "Quotient 0, remainder 1. Quotient 0 ho gaya, ab ruk jao.", highlight: "1" },
        { title: "Neeche se upar padho", description: "Remainders ko ulta padho: 1, 1, 0, 1 → 1101. Check: 8 + 4 + 0 + 1 = 13.", highlight: "1101" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "How many bits make one byte?",
        options: ["4", "8", "16", "1024"],
        correct: [1],
        explanation: "Ek byte = 8 bits. Ye standard hai, isliye 8 switches wala board = ek byte.",
        tags: ["units"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the decimal value of the binary number 101?",
        options: ["3", "5", "6", "101"],
        correct: [1],
        explanation: "101 = 1×4 + 0×2 + 1×1 = 5. Har position ki value right se 1, 2, 4 hoti hai.",
        tags: ["conversion"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "How many different values can one byte represent?",
        options: ["8", "255", "256", "1024"],
        correct: [2],
        explanation: "8 bits ke 2^8 = 256 patterns bante hain (0 se 255). Max value 255 hai, par total values 256 hain — dono ko mix mat karo.",
        tags: ["units"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these statements are true?",
        options: [
          "A bit can only be 0 or 1",
          "In memory sizes, 1 KB is usually counted as 1024 bytes",
          "Binary 10 equals decimal 10",
          "Text characters are stored as numbers inside the computer",
        ],
        correct: [0, 1, 3],
        explanation: "Bit sirf 0/1 hota hai, memory mein 1 KB = 1024 bytes (2^10) maana jaata hai, aur letters ek number table (ASCII/Unicode) se store hote hain. Binary 10 toh decimal 2 hai, 10 nahi.",
        tags: ["concepts"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `console.log((10).toString(2));
console.log(parseInt("111", 2));`,
        codeLanguage: "javascript",
        options: ["1010 and then 7", "10 and then 111", "1010 and then 111", "2 and then 7"],
        correct: [0],
        explanation: "toString(2) decimal 10 ko binary '1010' banata hai. parseInt('111', 2) binary 111 ko decimal 4 + 2 + 1 = 7 banata hai.",
        tags: ["code"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "Your internet plan is 100 Mbps. A 100 MB file takes about 8 seconds to download, not 1 second. Why?",
        options: [
          "Mbps means megabits; 1 byte = 8 bits, so 100 MB is about 800 megabits",
          "The server is always slow",
          "MB and Mb mean the same thing",
          "Wi-Fi converts binary to decimal before downloading",
        ],
        correct: [0],
        explanation: "Plan ki speed bits mein hoti hai (small b), file size bytes mein (capital B). 100 MB × 8 = 800 Mb, aur 800 ÷ 100 = 8 second. Ye 8 ka factor yaad rakho.",
        tags: ["units", "real-world"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Put the steps in order to convert decimal 6 to binary.",
        options: [
          "Divide 6 by 2: quotient 3, remainder 0",
          "Divide 3 by 2: quotient 1, remainder 1",
          "Divide 1 by 2: quotient 0, remainder 1",
          "Read the remainders from bottom to top: 110",
        ],
        explanation: "Baar baar 2 se divide karo jab tak quotient 0 na ho jaaye, phir remainders neeche se upar padho: 110 = 4 + 2 + 0 = 6.",
        tags: ["conversion"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why do computers use binary instead of the decimal system?",
        keywords: ["two states", "on off", "transistor", "reliable", "voltage"],
        explanation: "Computer transistors se bana hai jo switch ki tarah ON/OFF hote hain. Do voltage levels pehchaanna easy aur reliable hai, 10 levels mein noise se galtiyan hoti. Isliye binary.",
        tags: ["concepts"],
      },
    ],
    buildTask: {
      title: "Decimal to binary converter",
      description: `Ek function **\`toBinary(n)\`** likho jo ek non-negative integer \`n\` le aur uska binary form **string** mein return kare.

- \`toBinary(5)\` → \`"101"\`
- \`toBinary(0)\` → \`"0"\`

Built-in jaise \`toString(2)\` ya \`bin()\` use **mat** karo — repeated division by 2 wala tareeka khud implement karo.`,
      functionName: "toBinary",
      starterJs: `function toBinary(n) {
  // TODO: repeatedly divide by 2 and collect remainders
}
`,
      starterPython: `def toBinary(n):
    # TODO: repeatedly divide by 2 and collect remainders
    pass
`,
      tests: [
        { name: "zero", args: [0], expected: "0" },
        { name: "one", args: [1], expected: "1" },
        { name: "five", args: [5], expected: "101" },
        { name: "ten", args: [10], expected: "1010" },
        { name: "one full byte", args: [255], expected: "11111111", hidden: true },
        { name: "1024", args: [1024], expected: "10000000000", hidden: true },
      ],
      hints: [
        "Binary banane ke liye number ko baar baar 2 se divide karo. Har remainder (0 ya 1) ek bit hai, aur remainders ko ulta padhna hai.",
        "Ek khaali string lo. Jab tak n > 0 hai: remainder n % 2 ko string ke AAGE jodo, phir n ko floor(n / 2) kar do. n = 0 wala case alag se handle karo.",
        "JS: while (n > 0) { bits = (n % 2) + bits; n = Math.floor(n / 2); }  |  Python: while n > 0: bits = str(n % 2) + bits; n = n // 2",
      ],
      explainQuestions: [
        { question: "Why do you add each new remainder to the front of the string instead of the end?", keywords: ["reverse", "bottom to top", "least significant", "first remainder"] },
        { question: "Why does n = 0 need special handling?", keywords: ["loop", "never runs", "empty string", "zero"] },
        { question: "What does n % 2 tell you about the number?", keywords: ["remainder", "odd", "even", "last bit"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "What is the difference between a bit and a byte?",
        short: "A bit is the smallest unit of data, a single 0 or 1. A byte is a group of 8 bits, so it can represent 256 different values, from 0 to 255. Memory and file sizes are measured in bytes, while network speeds are usually measured in bits per second.",
        deep: `- **Bit**: one binary digit, 0 or 1. Physically, a transistor or a magnetic region in one of two states.
- **Byte**: 8 bits. It is the smallest **addressable** unit of memory on most machines — every memory address points to one byte.
- One byte has 2^8 = 256 patterns, enough for an ASCII character or an unsigned number 0–255.
- **Practical gotcha**: network speeds use bits (Mbps), storage uses bytes (MB). Divide Mbps by 8 to get MB/s.`,
        followUps: ["How many values can 2 bytes represent?", "Why is network speed measured in bits?", "What is a nibble?"],
        commonMistake: "Saying a byte's maximum value is 256. It has 256 values, but the maximum unsigned value is 255.",
        keywords: ["8 bits", "0 or 1", "256", "addressable"],
        difficulty: 1,
        roles: ["SDE", "BACKEND", "FULLSTACK"],
      },
      {
        question: "Why is 1 KB sometimes 1000 bytes and sometimes 1024 bytes?",
        short: "Memory is built in powers of two, so in computing 1 KB was traditionally 1024 bytes. The SI standard says kilo means 1000, so disk makers use 1000. The IEC created KiB, MiB and GiB to mean the 1024-based units clearly.",
        deep: `- 1024 = 2^10, which fits naturally with binary addressing, so RAM sizes use powers of two.
- Hard disk and SSD makers use decimal: 1 GB = 1,000,000,000 bytes.
- That is why a "500 GB" drive shows about **465 GiB** in your OS.
- Clear names: **KiB, MiB, GiB** = 1024-based; **KB, MB, GB** (SI) = 1000-based. Many tools still mix them, so always check the docs.`,
        followUps: ["Why does a 1 TB drive show less space in Windows?", "What is a GiB?"],
        commonMistake: "Assuming the missing disk space is used by hidden files, when it is just a unit difference.",
        keywords: ["1024", "power of two", "SI", "KiB"],
        difficulty: 2,
        roles: ["SDE", "DEVOPS", "BACKEND"],
      },
      {
        question: "How is text like the letter 'A' or a Hindi character stored in binary?",
        short: "Each character is mapped to a number using a character set like Unicode, and that number is stored as bytes using an encoding like UTF-8. 'A' is 65, stored as one byte 01000001. Hindi characters take three bytes in UTF-8, and most emoji take four.",
        deep: `- **Character set** (Unicode): gives every character a number called a code point. 'A' = U+0041, 'क' = U+0915.
- **Encoding** (UTF-8): decides how that number becomes bytes. UTF-8 uses 1 to 4 bytes per character and is backward compatible with ASCII.
- Consequence: \`"नमस्ते".length\` is not the same as its byte size. APIs, databases and file limits often count bytes.`,
        followUps: ["What is the difference between Unicode and UTF-8?", "Why do you sometimes see garbled text like 'à¤¨'?"],
        commonMistake: "Thinking Unicode and UTF-8 are the same thing.",
        keywords: ["unicode", "utf-8", "code point", "encoding"],
        difficulty: 2,
        roles: ["SDE", "BACKEND", "FRONTEND"],
      },
    ],
  },
  // ───────────────────────────── cpu-ram-storage ─────────────────────────────
  {
    slug: "cpu-ram-storage",
    estMinutes: 20,
    difficulty: 1,
    prerequisites: ["binary-bits-bytes"],
    objectives: [
      "Describe the job of the CPU, RAM and storage in simple words",
      "Explain why RAM is fast but temporary and storage is slow but permanent",
      "Follow what happens when you open an app, from disk to CPU",
      "Convert raw byte counts into human-readable sizes like 1.5 GB",
    ],
    technicalDefinition:
      "The CPU executes program instructions, RAM is volatile random-access memory that holds the code and data of running programs, and storage (SSD/HDD) is non-volatile memory that keeps files persistently when power is off.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `Har computer — laptop, phone, ya server — teen main parts pe chalta hai:

- **CPU (Central Processing Unit)**: computer ka **dimaag**. Ye instructions execute karta hai — add karna, compare karna, decide karna. Speed GHz mein naapi jaati hai (1 GHz ≈ 1 billion cycles per second).
- **RAM (Random Access Memory)**: **temporary, fast memory**. Jo app abhi chal rahi hai, uska code aur data yahan rehta hai. Power off = RAM khaali.
- **Storage (SSD / HDD)**: **permanent memory**. Tumhari photos, apps, files yahan save rehti hain, power off hone par bhi.

Simple line yaad rakho: **storage mein rakha hai, RAM mein chal raha hai, CPU kaam kar raha hai.**`,
          en: `Every computer — laptop, phone or server — runs on three main parts:

- **CPU (Central Processing Unit)**: the **brain**. It executes instructions — adding, comparing, deciding. Its speed is measured in GHz (1 GHz ≈ 1 billion cycles per second).
- **RAM (Random Access Memory)**: **temporary, fast memory**. The code and data of apps that are running right now live here. When power goes off, RAM is cleared.
- **Storage (SSD / HDD)**: **permanent memory**. Your photos, apps and files stay here even when power is off.

Remember: **stored on disk, loaded in RAM, worked on by the CPU.**`,
          hi: `हर कंप्यूटर — लैपटॉप, फ़ोन या सर्वर — तीन मुख्य हिस्सों पर चलता है:

- **CPU**: कंप्यूटर का **दिमाग़**। यह निर्देशों (instructions) को चलाता है — जोड़ना, तुलना करना, फ़ैसला लेना।
- **RAM**: **अस्थायी और तेज़ मेमोरी**। जो ऐप अभी चल रहा है, उसका कोड और डेटा यहाँ रहता है। बिजली गई तो RAM ख़ाली।
- **स्टोरेज (SSD / HDD)**: **स्थायी मेमोरी**। तुम्हारी फ़ोटो, ऐप और फ़ाइलें यहाँ बिजली बंद होने पर भी सुरक्षित रहती हैं।

याद रखो: **स्टोरेज में रखा है, RAM में चल रहा है, CPU काम कर रहा है।**`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Ek **restaurant kitchen** socho:

- **Chef = CPU.** Asli kaam wahi karta hai — kaatna, pakana, masala daalna. Jitna fast chef, utna fast khana.
- **Kitchen counter = RAM.** Chef wahi cheezein counter pe rakhta hai jo abhi chahiye. Counter se uthana bahut fast hai, par jagah limited hai. Raat ko restaurant band = counter saaf.
- **Godown / store room = Storage.** Saara stock — chawal ki boriyan, masale — yahan permanently rakha hai. Bahut jagah hai, par wahan jaake laana slow hai.

Jab order aata hai, helper godown se samaan laake counter pe rakhta hai (storage → RAM), aur chef counter se uthake pakata hai (RAM → CPU).

Agar counter chhota hai (kam RAM), toh helper baar baar godown jaayega — sab slow. Isliye 4 GB RAM wala laptop 30 tabs pe hang hota hai!`,
          en: `Think of a **restaurant kitchen**:

- **Chef = CPU.** The chef does the real work — cutting, cooking, adding spices. A faster chef means faster food.
- **Kitchen counter = RAM.** The chef keeps only what is needed right now on the counter. Picking things from the counter is very fast, but space is limited. At night, the counter is cleared.
- **Store room = Storage.** All the stock is kept here permanently. There is lots of space, but fetching from it is slow.

When an order comes, a helper brings items from the store room to the counter (storage → RAM), and the chef cooks from the counter (RAM → CPU). A small counter means many slow trips — like a 4 GB laptop with 30 tabs.`,
          hi: `एक **रेस्टोरेंट की रसोई** सोचो:

- **शेफ़ = CPU।** असली काम वही करता है — काटना, पकाना, मसाला डालना।
- **किचन काउंटर = RAM।** शेफ़ वही चीज़ें काउंटर पर रखता है जो अभी चाहिए। काउंटर से उठाना बहुत तेज़ है, पर जगह कम है। रात को काउंटर साफ़।
- **गोदाम = स्टोरेज।** सारा सामान यहाँ हमेशा के लिए रखा है। जगह बहुत है, पर वहाँ से लाना धीमा है।

ऑर्डर आने पर हेल्पर गोदाम से सामान काउंटर पर लाता है, और शेफ़ काउंटर से उठाकर पकाता है। काउंटर छोटा हो तो बार-बार गोदाम जाना पड़ता है — सब धीमा।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Sawal: ek hi memory kyun nahi? Kyunki **speed, cost aur permanence** teeno ek saath nahi milte.

- **CPU bahut fast hai** — ek second mein billions operations. Agar har baar data seedha SSD se laata, toh 99% time wait karta rehta.
- **RAM fast hai par mehngi aur volatile hai.** 16 GB RAM ka daam ~1 TB SSD ke aas-paas hota hai. Aur bijli gayi toh sab gayab.
- **Storage sasta aur permanent hai, par slow.**

Isliye computer ek **memory hierarchy** banata hai: chhoti aur super-fast cheezein CPU ke paas (registers, cache), phir RAM, phir badi aur slow storage.

Ye samajhna zaroori hai kyunki developer ke roop mein tumhe decide karna padega — data RAM mein cache karein (fast, par restart pe gaya) ya database/disk mein (safe, par slow)?`,
          en: `Why not use just one kind of memory? Because you cannot get **speed, low cost and permanence** all together.

- **The CPU is extremely fast** — billions of operations per second. If it read everything directly from an SSD, it would spend most of its time waiting.
- **RAM is fast but expensive and volatile.** 16 GB of RAM costs about the same as a 1 TB SSD, and it loses everything without power.
- **Storage is cheap and permanent, but slow.**

So computers use a **memory hierarchy**: small, super-fast memory near the CPU (registers, cache), then RAM, then large, slow storage. As a developer, you will often choose: keep data in RAM (fast, lost on restart) or on disk/database (safe, slower)?`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Real companies is hierarchy ko roz use karti hain:

- **IRCTC Tatkal booking**: 10 baje lakhs log ek saath aate hain. Train aur seat ka data har baar disk se padhna slow hoga, isliye systems hot data ko **RAM-based cache (jaise Redis)** mein rakhte hain.
- **Netflix / Hotstar**: popular episodes ko servers ki **RAM aur fast SSDs** pe rakhte hain taaki IPL match ya naya show bina buffering ke chale.
- **Android phones (Samsung, Xiaomi)**: jab RAM bhar jaati hai, OS purani background apps ko kill kar deta hai. Isliye WhatsApp kabhi kabhi "reload" hota hai jab tum wapas aate ho.

Aur AWS / Google Cloud pe server lete waqt tum literally choose karte ho: kitne **vCPU**, kitni **RAM (GB)**, kitna **storage** — aur har ek ka alag paisa lagta hai.`,
          en: `Real companies use this hierarchy every day:

- **IRCTC Tatkal booking**: lakhs of users arrive at 10 AM. Reading train and seat data from disk every time is too slow, so hot data is kept in a **RAM-based cache like Redis**.
- **Netflix / Hotstar** keep popular episodes on server **RAM and fast SSDs**, so an IPL match or a new show plays without buffering.
- **Android phones (Samsung, Xiaomi)**: when RAM is full, the OS kills old background apps. That is why WhatsApp sometimes reloads when you switch back.

When you rent a server on AWS or Google Cloud, you literally choose how many **vCPUs**, how much **RAM** and how much **storage** — each has a separate price.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Jab tum koi app kholte ho, andar ye hota hai:

1. **Storage se load**: OS app ki file SSD se padhta hai aur uska code + data **RAM** mein copy karta hai.
2. **Fetch**: CPU RAM se agla instruction laata hai (actually pehle **cache** mein dekhta hai — L1, L2, L3, jo CPU ke andar hi super-fast memory hai).
3. **Decode**: CPU samajhta hai instruction kya bol raha hai — "add karo", "compare karo", "memory mein likho".
4. **Execute**: CPU ka ALU kaam karta hai, result **registers** (CPU ki sabse fast memory) mein jaata hai.
5. Ye **fetch-decode-execute cycle** billions baar per second chalta hai.

Speed ka rough idea (L1 cache = 1 unit): RAM ≈ 100 guna slow, SSD ≈ 1 lakh guna slow, HDD ≈ 1 crore guna slow. Isliye RAM khatam hone par jab OS data disk pe "swap" karta hai, computer hang jaisa lagta hai.`,
          en: `When you open an app, this happens inside:

1. **Load from storage**: the OS reads the app file from the SSD and copies its code and data into **RAM**.
2. **Fetch**: the CPU gets the next instruction from RAM (it first checks its **cache** — L1, L2, L3, super-fast memory inside the CPU).
3. **Decode**: the CPU works out what the instruction means — add, compare, write to memory.
4. **Execute**: the CPU's ALU does the work and puts the result in **registers**, the fastest memory of all.
5. This **fetch-decode-execute cycle** runs billions of times per second.

Rough speeds (L1 cache = 1): RAM is ~100× slower, SSD ~100,000×, HDD ~10,000,000×. That is why a computer feels frozen when the OS starts "swapping" RAM data to disk.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Ye program do cheezein dikhata hai: memory levels ki speed, aur RAM ka "power cut pe khaali hona".

1. \`levels\` list mein har memory ka rough access time nanoseconds (ns) mein hai.
2. Loop har level print karta hai aur batata hai wo L1 cache se kitne guna slow hai (\`ns / levels[0][1]\`).
3. \`storage\` ek object/dict hai — ye permanent disk jaisa hai. \`ram\` ek khaali list hai.
4. "App open" karne par hum file ko storage se RAM mein copy karte hain (\`push\` / \`append\`).
5. \`ram.length = 0\` / \`ram.clear()\` power cut simulate karta hai — RAM khaali ho gayi.
6. Last line dikhati hai ki storage ka data abhi bhi safe hai.`,
          en: `This program shows two things: the speed of memory levels, and RAM being cleared on a power cut.

1. The \`levels\` list holds the rough access time of each memory in nanoseconds (ns).
2. The loop prints each level and how many times slower it is than the L1 cache (\`ns / levels[0][1]\`).
3. \`storage\` is an object/dict that acts like a permanent disk. \`ram\` starts as an empty list.
4. "Opening the app" copies a file from storage into RAM (\`push\` / \`append\`).
5. \`ram.length = 0\` / \`ram.clear()\` simulates a power cut — RAM is now empty.
6. The last line shows that the data on storage is still safe.`,
        },
        codeJs: `// Rough access times in nanoseconds (real values vary by machine)
const levels = [
  ["L1 cache", 1],
  ["RAM", 100],
  ["SSD", 100000],
  ["HDD", 10000000],
];

for (const [name, ns] of levels) {
  const times = ns / levels[0][1];
  console.log(name.padEnd(9) + " ~" + ns + " ns  (" + times + "x slower than L1)");
}

// Storage is permanent, RAM is temporary
const storage = { "game.exe": "game code", "photo.jpg": "pixels" };
const ram = [];

ram.push(storage["game.exe"]);
console.log("RAM after opening game:", ram);

ram.length = 0; // power cut!
console.log("RAM after power cut:", ram);
console.log("Files still on storage:", Object.keys(storage).join(", "));
`,
        codePython: `# Rough access times in nanoseconds (real values vary by machine)
levels = [
    ("L1 cache", 1),
    ("RAM", 100),
    ("SSD", 100000),
    ("HDD", 10000000),
]

for name, ns in levels:
    times = ns // levels[0][1]
    print(f"{name:<9} ~{ns} ns  ({times}x slower than L1)")

# Storage is permanent, RAM is temporary
storage = {"game.exe": "game code", "photo.jpg": "pixels"}
ram = []

ram.append(storage["game.exe"])
print("RAM after opening game:", ram)

ram.clear()  # power cut!
print("RAM after power cut:", ram)
print("Files still on storage:", ", ".join(storage.keys()))
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Common confusions:

- **"Mere phone mein 128 GB RAM hai."** Nahi bhai, wo **storage** hai. RAM usually 4–12 GB hoti hai. Dono ko mix mat karo.
- **Socho ki variable save ho gaya.** Program ke variables RAM mein hain. Program band = data gayab. Permanent chahiye toh file ya database mein likho.
- **Sirf GHz dekhkar CPU judge karna.** Cores, cache size aur generation bhi matter karte hain. Naya 2.5 GHz CPU purane 3.5 GHz se fast ho sakta hai.
- **"Zyada RAM = hamesha fast."** Agar tumhara kaam 6 GB use karta hai, toh 16 GB se 32 GB karne pe koi fark nahi padega. Fark tab padta hai jab RAM **kam pad rahi ho**.
- **Code mein bada data ek saath RAM mein load karna** — jaise 5 GB CSV ek baar mein padhna. Laptop hang ho jaayega; chunks mein padho.`,
          en: `Common confusions:

- **"My phone has 128 GB RAM."** No — that is **storage**. RAM is usually 4–12 GB. Do not mix them up.
- **Thinking a variable is saved.** Program variables live in RAM. When the program stops, they are gone. For permanent data, write to a file or database.
- **Judging a CPU only by GHz.** Cores, cache size and generation matter too. A new 2.5 GHz CPU can beat an old 3.5 GHz one.
- **"More RAM is always faster."** If your work uses 6 GB, going from 16 GB to 32 GB changes nothing. More RAM helps only when you are **running out**.
- **Loading huge data into RAM at once**, like a 5 GB CSV. Read it in chunks instead.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Jab laptop ya server slow ho, andaaza mat lagao — **measure karo**:

1. **Task Manager (Windows) / Activity Monitor (Mac) / \`htop\` (Linux)** kholo. Dekho CPU %, Memory %, Disk % mein se kaunsa 100% ke paas hai.
2. **CPU 100%?** Koi program heavy calculation ya infinite loop mein phansa hai. Process ka naam dekho.
3. **RAM full aur "swap" use ho raha hai?** Tabs/apps band karo, ya code mein memory leak dhoondo (list jo badhti hi ja rahi hai).
4. **Disk 100%?** Bahut saari file reading/writing ho rahi hai — HDD pe ye common hai.
5. Server pe: \`free -h\` RAM dikhata hai, \`df -h\` disk space dikhata hai. "No space left on device" error = storage full, RAM nahi.

Error message dhyaan se padho: **"Out of memory"** = RAM, **"Disk full"** = storage.`,
          en: `When a laptop or server is slow, do not guess — **measure**:

1. Open **Task Manager (Windows) / Activity Monitor (Mac) / \`htop\` (Linux)**. Check which of CPU %, Memory % or Disk % is near 100%.
2. **CPU at 100%?** Some program is doing heavy work or is stuck in an infinite loop. Look at the process name.
3. **RAM full and swap in use?** Close apps, or look for a memory leak in your code (a list that keeps growing).
4. **Disk at 100%?** Lots of file reading or writing — common on HDDs.
5. On a server: \`free -h\` shows RAM, \`df -h\` shows disk space. "No space left on device" means storage is full, not RAM.

Read errors carefully: **"Out of memory"** = RAM, **"Disk full"** = storage.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Har level ka apna trade-off hai:

- **RAM mein data rakhna (in-memory cache)**: super fast, par mehenga, limited aur restart pe gayab. Session data, frequently used results ke liye best.
- **SSD**: fast aur permanent, HDD se mehenga. Aaj kal laptops aur servers ka default.
- **HDD**: sasta aur bada, par slow (moving parts). Backups aur archives ke liye theek.
- **Cloud storage (S3)**: almost unlimited aur sasta, par network ke through — sabse slow access.

Rule of thumb: **jo data baar baar chahiye aur kho jaaye toh chalega → RAM. Jo data kabhi khona nahi chahiye → disk/database.** Bahut saare systems dono use karte hain: database mein permanent copy, aur Redis mein fast copy.`,
          en: `Each level has its own trade-off:

- **Keeping data in RAM (in-memory cache)**: super fast, but expensive, limited and lost on restart. Best for session data and frequently used results.
- **SSD**: fast and permanent, more expensive than HDD. The default for laptops and servers today.
- **HDD**: cheap and large, but slow because of moving parts. Fine for backups and archives.
- **Cloud storage (S3)**: almost unlimited and cheap, but accessed over the network — the slowest.

Rule of thumb: **data needed often and okay to lose → RAM. Data that must never be lost → disk or database.** Many systems use both: a permanent copy in a database and a fast copy in Redis.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Maan lo tum ek **food delivery app ka backend** bana rahe ho aur use ek chhote cloud server (1 vCPU, 1 GB RAM, 25 GB SSD) pe deploy kiya.

- Restaurant menu har request pe database se aata hai — slow. Tum menu ko **RAM mein cache** karte ho, response 300 ms se 20 ms ho jaata hai.
- Ek din server crash: logs mein "JavaScript heap out of memory". Pata chala ek report saare orders ek saath RAM mein load kar rahi thi. Fix: pagination / chunks.
- Dusre din "No space left on device" — log files ne 25 GB SSD bhar diya. Fix: log rotation.
- Dashboard mein disk usage dikhana hai: \`26843545600\` bytes ko "25 GB" mein badalna padta hai — yahi is topic ka build task hai.

CPU, RAM, storage ki samajh se tum sahi server size chunte ho aur paisa bachate ho.`,
          en: `Say you build a **food delivery app backend** and deploy it on a small cloud server (1 vCPU, 1 GB RAM, 25 GB SSD).

- The restaurant menu comes from the database on every request — slow. You **cache it in RAM**, and response time drops from 300 ms to 20 ms.
- One day the server crashes with "JavaScript heap out of memory". A report was loading all orders into RAM at once. Fix: pagination or chunks.
- Next day: "No space left on device" — log files filled the 25 GB SSD. Fix: log rotation.
- The dashboard must show disk usage: \`26843545600\` bytes should read "25 GB" — that is this topic's build task.`,
        },
      },
    ],
    visualization: {
      kind: "FLOW",
      title: "App kholne se CPU tak ka safar",
      steps: [
        { title: "App icon pe click", description: "OS ko pata chalta hai ki kaunsi program file chalani hai. File abhi SSD (storage) pe padi hai.", highlight: "Storage" },
        { title: "Storage → RAM", description: "OS program ka code aur zaroori data SSD se RAM mein copy karta hai. Isi waqt loading screen dikhti hai.", highlight: "RAM" },
        { title: "RAM → Cache", description: "CPU jo instructions abhi chahiye unhe apne andar ke super-fast cache (L1/L2/L3) mein laata hai.", highlight: "Cache" },
        { title: "Fetch-Decode-Execute", description: "CPU har instruction ko laata hai, samajhta hai aur chalata hai — billions baar per second.", highlight: "CPU" },
        { title: "Save karna", description: "Jab tum Save dabate ho, data RAM se wapas storage pe likha jaata hai, taaki power off ke baad bhi rahe.", highlight: "Storage" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which of these loses its data when the power goes off?",
        options: ["SSD", "Hard disk (HDD)", "RAM", "Pen drive"],
        correct: [2],
        explanation: "RAM volatile hai — bijli gayi toh data gaya. SSD, HDD aur pen drive non-volatile hain, data bacha rehta hai.",
        tags: ["ram"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which component actually executes program instructions?",
        options: ["RAM", "CPU", "SSD", "Monitor"],
        correct: [1],
        explanation: "CPU hi chef hai jo instructions chalata hai. RAM aur SSD sirf data rakhte hain.",
        tags: ["cpu"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Which order goes from FASTEST to SLOWEST?",
        options: [
          "CPU cache > RAM > SSD > HDD",
          "HDD > SSD > RAM > CPU cache",
          "RAM > CPU cache > SSD > HDD",
          "SSD > RAM > CPU cache > HDD",
        ],
        correct: [0],
        explanation: "Jo CPU ke jitna paas, utna fast: cache (CPU ke andar) > RAM > SSD > HDD (moving parts, sabse slow).",
        tags: ["hierarchy"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which statements about RAM are true?",
        options: [
          "It is volatile",
          "It is faster than an SSD",
          "It holds the code and data of running programs",
          "It permanently stores your photos",
        ],
        correct: [0, 1, 2],
        explanation: "RAM volatile hai, SSD se fast hai, aur running programs ka data rakhti hai. Photos permanently storage mein rehti hain, RAM mein nahi.",
        tags: ["ram"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "This code simulates a power cut. What does it print?",
        code: `ram = []
storage = ["notes.txt"]
ram.append(storage[0])
ram.clear()  # power cut
print(len(ram), len(storage))`,
        codeLanguage: "python",
        options: ["0 1", "1 1", "1 0", "0 0"],
        correct: [0],
        explanation: "Power cut ne sirf ram ko clear kiya, toh len(ram) = 0. Storage permanent hai, usme abhi bhi 1 file hai. Output: 0 1.",
        tags: ["code"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "Your laptop has 4 GB RAM. With 30 Chrome tabs open, everything becomes very slow and the disk light keeps blinking. What is the best explanation?",
        options: [
          "RAM is full, so the OS swaps data to the disk, which is much slower",
          "The CPU has too many cores",
          "The SSD is too fast for the RAM",
          "The internet connection is slow",
        ],
        correct: [0],
        explanation: "RAM bhar gayi toh OS kuch data disk pe 'swap' karta hai. Disk RAM se hazaaron guna slow hai, isliye sab atakne lagta hai aur disk light blink karti hai.",
        tags: ["performance"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Put the steps in order for what happens when you open a game.",
        options: [
          "The game files are read from the SSD",
          "The code and data are loaded into RAM",
          "The CPU fetches instructions from RAM (through its cache)",
          "The CPU executes them and the game appears on screen",
        ],
        explanation: "Pehle storage se file uthti hai, RAM mein load hoti hai, phir CPU wahan se instructions laake chalata hai. Storage → RAM → CPU.",
        tags: ["flow"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why do computers need both RAM and storage instead of just one of them?",
        keywords: ["volatile", "faster", "permanent", "cost", "power"],
        explanation: "RAM fast hai par volatile aur mehngi; storage permanent aur sasta par slow. Dono mila ke speed bhi milti hai aur data bhi safe rehta hai.",
        tags: ["concepts"],
      },
    ],
    buildTask: {
      title: "Bytes to human-readable size",
      description: `Ek function **\`humanBytes(n)\`** likho jo bytes ki ginti (non-negative integer) le aur readable string return kare.

Rules:
- 1 KB = 1024 B, 1 MB = 1024 KB, aur aise hi GB, TB tak.
- 1024 se kam ho toh bytes mein: \`512\` → \`"512 B"\`.
- Warna sabse bada unit chuno jisme value ≥ 1 ho, aur **ek decimal tak round** karo.
- Agar decimal \`.0\` aaye toh hata do: \`1024\` → \`"1 KB"\`, \`1536\` → \`"1.5 KB"\`.
- Number aur unit ke beech ek space.`,
      functionName: "humanBytes",
      starterJs: `function humanBytes(n) {
  // TODO: divide by 1024 until the value is small enough
}
`,
      starterPython: `def humanBytes(n):
    # TODO: divide by 1024 until the value is small enough
    pass
`,
      tests: [
        { name: "zero bytes", args: [0], expected: "0 B" },
        { name: "under 1 KB", args: [512], expected: "512 B" },
        { name: "exactly 1 KB", args: [1024], expected: "1 KB" },
        { name: "one and a half KB", args: [1536], expected: "1.5 KB" },
        { name: "exactly 1 MB", args: [1048576], expected: "1 MB" },
        { name: "five GB", args: [5368709120], expected: "5 GB", hidden: true },
        { name: "one and a half GB", args: [1610612736], expected: "1.5 GB", hidden: true },
      ],
      hints: [
        "Units ki list banao: B, KB, MB, GB, TB. Jab tak value 1024 ya usse zyada hai, use 1024 se divide karo aur agle unit pe jao.",
        "Ek index i rakho (0 = B). Loop ke baad: agar i == 0 toh seedha 'n B' return karo. Warna value ko 1 decimal tak round karo aur '.0' ho toh hata do.",
        "JS: let v = n, i = 0; while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; } const r = Math.round(v * 10) / 10;  |  Python: r = round(v, 1); text = str(int(r)) if r == int(r) else str(r)",
      ],
      explainQuestions: [
        { question: "Why do you divide by 1024 and not 1000?", keywords: ["power of two", "binary", "1024", "kib"] },
        { question: "How did you remove the trailing .0 from whole numbers?", keywords: ["integer", "round", "check", "string"] },
        { question: "What stops your loop from going past the largest unit?", keywords: ["index", "length", "condition", "tb"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "What is the difference between RAM and storage?",
        short: "RAM is fast, volatile memory that holds the code and data of programs that are currently running; it is cleared when power is lost. Storage like an SSD is slower but non-volatile, so files stay there permanently. Programs are loaded from storage into RAM before the CPU runs them.",
        deep: `- **Speed**: RAM ~100 ns; SSD ~100 µs; HDD ~10 ms.
- **Volatile**: RAM yes; storage no.
- **Cost per GB**: RAM high; storage low.
- **Typical size**: RAM 8–64 GB; storage 256 GB–2 TB.

- The OS uses RAM for running processes and spills to **swap** on disk when RAM is full, which is very slow.
- In backend systems this maps to **cache (Redis, in-memory)** vs **database (on disk)**.`,
        followUps: ["What is swap memory?", "Where does a Redis cache keep its data?", "What is virtual memory?"],
        commonMistake: "Calling phone storage 'RAM', or forgetting that in-memory data disappears on restart.",
        keywords: ["volatile", "persistent", "speed", "load"],
        difficulty: 1,
        roles: ["SDE", "BACKEND", "DEVOPS"],
      },
      {
        question: "What is CPU cache and why does it matter for performance?",
        short: "CPU cache is a small amount of very fast memory inside the CPU, organised as L1, L2 and L3. It keeps recently used data close to the CPU so it does not wait for slower RAM. Code that accesses memory in order, like looping through an array, uses the cache well and runs faster.",
        deep: `- **L1** is the smallest and fastest (~1 ns), **L3** is larger and shared between cores.
- A **cache hit** means the data is already there; a **cache miss** means fetching from RAM (~100 ns).
- **Locality**: programs tend to reuse recent data (temporal) and nearby data (spatial). Arrays are cache-friendly; scattered linked-list nodes are not.
- This is why the same algorithm can run noticeably faster with a better memory access pattern.`,
        followUps: ["What is a cache miss?", "Why are arrays often faster than linked lists in practice?"],
        commonMistake: "Confusing CPU cache with application caches like Redis or browser cache.",
        keywords: ["l1", "cache hit", "locality", "latency"],
        difficulty: 2,
        roles: ["SDE", "BACKEND"],
      },
    ],
  },
  // ───────────────────────────── how-code-runs ─────────────────────────────
  {
    slug: "how-code-runs",
    estMinutes: 25,
    difficulty: 2,
    prerequisites: ["cpu-ram-storage", "operating-system-basics"],
    objectives: [
      "Explain why source code must be translated before the CPU can run it",
      "Compare compilers and interpreters, and when each finds errors",
      "Describe how Python and JavaScript actually run (bytecode, VM, JIT)",
      "Tell the difference between compile-time and runtime errors",
    ],
    technicalDefinition:
      "Source code is translated into machine instructions either ahead of time by a compiler, which produces an executable, or at run time by an interpreter (often via intermediate bytecode and a JIT compiler), which executes the program statement by statement.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `CPU sirf **machine code** samajhta hai — 0 aur 1 wale instructions. Tum jo \`print("hello")\` ya \`console.log("hello")\` likhte ho, wo insaano ke liye hai. Beech mein ek **translator** chahiye.

Translator do type ke hote hain:

- **Compiler**: poora program ek baar mein machine code mein badal deta hai aur ek file (jaise \`.exe\`) bana deta hai. Phir wo file baar baar chalao. Example: **C, C++, Go, Rust**.
- **Interpreter**: program ko **line by line** padhta hai aur saath saath chalata hai. Alag executable file nahi banti. Example: **Python, JavaScript** (andar se thoda mix hai, aage dekhenge).

Dono ka goal same hai: tumhara code CPU tak pahunchana.`,
          en: `A CPU only understands **machine code** — instructions made of 0s and 1s. The \`print("hello")\` or \`console.log("hello")\` you write is for humans. We need a **translator** in between.

There are two main kinds:

- **Compiler**: translates the whole program into machine code at once and produces a file (like an \`.exe\`). You can run that file again and again. Examples: **C, C++, Go, Rust**.
- **Interpreter**: reads the program **line by line** and runs it as it goes. No separate executable is produced. Examples: **Python, JavaScript** (internally they mix both ideas).

Both have the same goal: get your code to the CPU.`,
          hi: `CPU सिर्फ़ **मशीन कोड** समझता है — 0 और 1 वाले निर्देश। तुम जो \`print("hello")\` लिखते हो, वह इंसानों के लिए है। बीच में एक **अनुवादक** चाहिए।

अनुवादक दो तरह के होते हैं:

- **कंपाइलर**: पूरे प्रोग्राम को एक बार में मशीन कोड में बदल देता है और एक फ़ाइल (जैसे \`.exe\`) बनाता है। उदाहरण: C, C++, Go।
- **इंटरप्रेटर**: प्रोग्राम को **लाइन-दर-लाइन** पढ़ता है और साथ-साथ चलाता है। उदाहरण: Python, JavaScript।

दोनों का लक्ष्य एक है: तुम्हारा कोड CPU तक पहुँचाना।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Socho ek **Japanese movie** hai aur tumhe Hindi mein dekhni hai.

- **Compiler = dubbing studio.** Release se pehle poori movie ko Hindi mein dub kar diya. Time laga, par ab jitni baar chahe dekho — fast aur smooth. Aur agar script mein galti thi, toh dubbing ke time hi pakdi gayi, audience tak pahunchi hi nahi.
- **Interpreter = live translator.** Tum movie dekh rahe ho aur bagal mein ek dost har dialogue sunke turant translate karta ja raha hai. Start turant ho gaya, koi preparation nahi. Par thoda slow hai, aur agar 90th minute pe koi ajeeb dialogue aaya toh dost wahin atak jaayega — tab tak tum 89 minute dekh chuke ho.

Isliye compiled programs ke errors **chalne se pehle** milte hain, aur interpreted programs ke kai errors **chalte chalte**.`,
          en: `Imagine a **Japanese movie** that you want to watch in Hindi.

- **Compiler = dubbing studio.** Before release, the whole movie is dubbed into Hindi. It takes time, but then you can watch it again and again, fast and smooth. If the script had a mistake, it was caught during dubbing, before any audience saw it.
- **Interpreter = live translator.** A friend sits next to you and translates each dialogue as it plays. It starts immediately with no preparation, but it is a little slower. If a strange line appears at minute 90, your friend gets stuck there — after you have already watched 89 minutes.

So compiled programs show many errors **before running**, while interpreted programs show many errors **while running**.`,
          hi: `सोचो एक **जापानी फ़िल्म** है और तुम्हें हिंदी में देखनी है।

- **कंपाइलर = डबिंग स्टूडियो।** रिलीज़ से पहले पूरी फ़िल्म हिंदी में डब कर दी गई। समय लगा, पर अब जितनी बार चाहो देखो — तेज़ और आराम से। गलती डबिंग के समय ही पकड़ में आ गई।
- **इंटरप्रेटर = लाइव अनुवादक।** तुम फ़िल्म देख रहे हो और बगल में दोस्त हर डायलॉग तुरंत अनुवाद कर रहा है। शुरुआत तुरंत हुई, पर थोड़ा धीमा है, और 90वें मिनट पर कोई अजीब डायलॉग आया तो वहीं अटक जाएगा।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Agar translator na ho, toh har programmer ko seedha machine code likhna padta — \`10110000 01100001\` jaisa. Ek chhota sa app banane mein mahine lag jaate, aur har CPU (Intel, ARM, Apple M-series) ke liye alag code likhna padta.

Translators ye problems solve karte hain:

- **Insaan-friendly code**: tum \`total = price * qty\` likhte ho, CPU ko 5–10 machine instructions milte hain.
- **Portability**: same Python code Windows, Mac, Linux sab pe chal jaata hai, kyunki har jagah ka interpreter apne CPU ke liye translate karta hai.
- **Error checking**: compilers aur interpreters typos aur galat syntax pakad lete hain.

Ye samajhna isliye zaroori hai kyunki tumhe pata hona chahiye **error kab aayega** (run se pehle ya beech mein) aur **code slow kyun hai**.`,
          en: `Without translators, every programmer would have to write raw machine code like \`10110000 01100001\`. A small app would take months, and you would need different code for every CPU (Intel, ARM, Apple M-series).

Translators solve these problems:

- **Human-friendly code**: you write \`total = price * qty\`, and the CPU receives 5–10 machine instructions.
- **Portability**: the same Python code runs on Windows, Mac and Linux, because each interpreter translates for its own CPU.
- **Error checking**: compilers and interpreters catch typos and bad syntax.

Knowing this helps you understand **when an error will appear** (before running or in the middle) and **why some code is slow**.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Real duniya mein dono approaches dikhte hain:

- **Google Chrome (V8 engine)**: JavaScript ko interpret karta hai, phir jo code baar baar chalta hai ("hot code") use **JIT (Just-In-Time) compile** karke fast machine code bana deta hai. Isliye Gmail, Google Docs browser mein itne smooth chalte hain. Node.js bhi yahi V8 use karta hai.
- **Instagram (Meta)**: backend ka bada hissa **Python (Django)** mein hai. Python pehle code ko **bytecode** (\`.pyc\`) mein badalta hai, phir Python Virtual Machine use chalata hai.
- **Uber / Swiggy jaise companies** high-performance services ke liye **Go** use karti hain — ye compiled language hai, ek single fast binary file banti hai jo server pe seedha chal jaati hai.

Isliye job descriptions mein "compiled language experience" ya "Node.js" alag alag likha hota hai.`,
          en: `Both approaches are used in the real world:

- **Google Chrome (V8 engine)** interprets JavaScript, then **JIT (Just-In-Time) compiles** the code that runs often ("hot code") into fast machine code. That is why Gmail and Google Docs feel smooth. Node.js uses the same V8 engine.
- **Instagram (Meta)** runs much of its backend on **Python (Django)**. Python first turns code into **bytecode** (\`.pyc\`), and the Python Virtual Machine runs it.
- **Uber and Swiggy** use **Go** for many high-performance services. Go is compiled into a single fast binary that runs directly on the server.

That is why job posts mention "compiled languages" and "Node.js" separately.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Andar ka rasta step by step:

1. **Source code**: tumhari \`.py\` ya \`.js\` file — bas text.
2. **Lexing / tokenizing**: text ko chhote tukdon (tokens) mein todna: \`total\`, \`=\`, \`price\`, \`*\`, \`qty\`.
3. **Parsing**: tokens se ek tree banta hai (**AST — Abstract Syntax Tree**). Agar bracket missing hai toh yahin **SyntaxError** aata hai — ek bhi line chalne se pehle.
4. **Translate**:
   - Compiler (C, Go): AST → machine code → executable file.
   - Python: AST → **bytecode** → Python VM ek ek bytecode instruction chalata hai.
   - JavaScript (V8): AST → bytecode → interpreter chalata hai → hot code ko JIT machine code mein badalta hai.
5. **Run**: CPU machine instructions execute karta hai. Yahan aane wale errors — jaise undefined variable ya divide by zero — **runtime errors** kehlate hain.`,
          en: `The path inside, step by step:

1. **Source code**: your \`.py\` or \`.js\` file — just text.
2. **Lexing / tokenizing**: the text is split into tokens: \`total\`, \`=\`, \`price\`, \`*\`, \`qty\`.
3. **Parsing**: tokens become a tree called an **AST (Abstract Syntax Tree)**. A missing bracket causes a **SyntaxError** here — before any line runs.
4. **Translate**:
   - Compiler (C, Go): AST → machine code → executable file.
   - Python: AST → **bytecode** → the Python VM runs each bytecode instruction.
   - JavaScript (V8): AST → bytecode → interpreter runs it → hot code is JIT-compiled to machine code.
5. **Run**: the CPU executes machine instructions. Errors here, like an undefined variable or divide by zero, are **runtime errors**.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yahan humne ek **chhoti si language** banayi hai (SET, ADD, MUL, PRINT) aur uske liye ek interpreter aur ek compiler likha hai.

1. \`interpret\` har line ko todta hai (\`split\`) aur **turant** chalata hai. Unknown command mile toh wahin error deta hai — par tab tak pichli lines chal chuki hoti hain.
2. \`compile\` pehle **saari lines check** karta hai aur unhe instruction objects ki list mein badalta hai. Ek bhi galat line mili toh kuch bhi nahi chalta.
3. \`runCompiled\` sirf compiled instructions chalata hai — dobara parsing nahi.
4. Neeche \`badSource\` ke saath dono ka behaviour compare karo: interpreter \`y = 1\` print karke fail hota hai, compiler shuru mein hi mana kar deta hai.`,
          en: `Here we invent a **tiny language** (SET, ADD, MUL, PRINT) and write both an interpreter and a compiler for it.

1. \`interpret\` splits each line and runs it **immediately**. On an unknown command it stops with an error — but earlier lines have already run.
2. \`compile\` first **checks every line** and turns them into a list of instruction objects. If any line is bad, nothing runs at all.
3. \`runCompiled\` only executes the compiled instructions — no parsing again.
4. With \`badSource\`, compare the two: the interpreter prints \`y = 1\` and then fails, while the compiler refuses before running anything.`,
        },
        codeJs: `const KNOWN = ["SET", "ADD", "MUL", "PRINT"];

// Interpreter: read one line, run it, move to the next
function interpret(lines) {
  const vars = {};
  for (let i = 0; i < lines.length; i++) {
    const [op, name, value] = lines[i].split(" ");
    if (op === "SET") vars[name] = Number(value);
    else if (op === "ADD") vars[name] += Number(value);
    else if (op === "MUL") vars[name] *= Number(value);
    else if (op === "PRINT") console.log("  " + name + " =", vars[name]);
    else return console.log("  Runtime error at line " + (i + 1) + ": unknown " + op);
  }
}

// Compiler: check and translate everything first
function compile(lines) {
  const program = [];
  for (let i = 0; i < lines.length; i++) {
    const [op, name, value] = lines[i].split(" ");
    if (!KNOWN.includes(op)) throw new Error("Compile error at line " + (i + 1) + ": unknown " + op);
    program.push({ op, name, value: Number(value) });
  }
  return program;
}

function runCompiled(program) {
  const vars = {};
  for (const ins of program) {
    if (ins.op === "SET") vars[ins.name] = ins.value;
    if (ins.op === "ADD") vars[ins.name] += ins.value;
    if (ins.op === "MUL") vars[ins.name] *= ins.value;
    if (ins.op === "PRINT") console.log("  " + ins.name + " =", vars[ins.name]);
  }
}

const source = ["SET x 5", "ADD x 3", "PRINT x", "MUL x 2", "PRINT x"];
console.log("Interpreter:");
interpret(source);
const program = compile(source);
console.log("Compiler produced", program.length, "instructions. Running:");
runCompiled(program);

const badSource = ["SET y 1", "PRINT y", "JUMP y 2"];
console.log("Interpreter on bad code:");
interpret(badSource);
console.log("Compiler on bad code:");
try {
  runCompiled(compile(badSource));
} catch (err) {
  console.log("  " + err.message + " (nothing ran)");
}
`,
        codePython: `KNOWN = ["SET", "ADD", "MUL", "PRINT"]


# Interpreter: read one line, run it, move to the next
def interpret(lines):
    vars = {}
    for i, line in enumerate(lines):
        op, name, value = (line.split(" ") + [None])[:3]
        if op == "SET":
            vars[name] = int(value)
        elif op == "ADD":
            vars[name] += int(value)
        elif op == "MUL":
            vars[name] *= int(value)
        elif op == "PRINT":
            print("  " + name + " =", vars[name])
        else:
            print("  Runtime error at line", i + 1, ": unknown", op)
            return


# Compiler: check and translate everything first
def compile_program(lines):
    program = []
    for i, line in enumerate(lines):
        op, name, value = (line.split(" ") + [None])[:3]
        if op not in KNOWN:
            raise ValueError("Compile error at line " + str(i + 1) + ": unknown " + op)
        program.append({"op": op, "name": name, "value": int(value) if value else None})
    return program


def run_compiled(program):
    vars = {}
    for ins in program:
        if ins["op"] == "SET":
            vars[ins["name"]] = ins["value"]
        elif ins["op"] == "ADD":
            vars[ins["name"]] += ins["value"]
        elif ins["op"] == "MUL":
            vars[ins["name"]] *= ins["value"]
        elif ins["op"] == "PRINT":
            print("  " + ins["name"] + " =", vars[ins["name"]])


source = ["SET x 5", "ADD x 3", "PRINT x", "MUL x 2", "PRINT x"]
print("Interpreter:")
interpret(source)
program = compile_program(source)
print("Compiler produced", len(program), "instructions. Running:")
run_compiled(program)

bad_source = ["SET y 1", "PRINT y", "JUMP y 2"]
print("Interpreter on bad code:")
interpret(bad_source)
print("Compiler on bad code:")
try:
    run_compiled(compile_program(bad_source))
except ValueError as err:
    print("  " + str(err) + " (nothing ran)")
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Beginners ki common galtiyan:

- **"Python compile nahi hota."** Hota hai — bytecode mein. Bas machine code ki \`.exe\` file nahi banti. \`__pycache__\` folder isi ka saboot hai.
- **"JavaScript slow hai kyunki interpreted hai."** Modern engines (V8) JIT use karte hain, hot code kaafi fast chalta hai.
- **SyntaxError aur runtime error ko same samajhna.** Missing bracket = poora file chalega hi nahi. Undefined variable = file chalegi, us line pe jaake crash.
- **Socho ki error wali line ke pehle ka code nahi chala.** Python/JS mein upar ki lines chal chuki hoti hain — jaise database mein half data likh diya gaya.
- **Mac pe compile kiya binary Windows pe chalana.** Machine code OS aur CPU specific hota hai; har platform ke liye alag build chahiye.`,
          en: `Common beginner mistakes:

- **"Python is not compiled."** It is — to bytecode. It just does not produce a machine-code \`.exe\`. The \`__pycache__\` folder is proof.
- **"JavaScript is slow because it is interpreted."** Modern engines like V8 use JIT, so hot code runs quite fast.
- **Mixing up SyntaxError and runtime errors.** A missing bracket stops the whole file from running. An undefined variable crashes only when that line runs.
- **Assuming nothing before the error ran.** In Python/JS, earlier lines have already run — maybe half the data is already written.
- **Running a binary compiled on Mac on Windows.** Machine code is specific to the OS and CPU; each platform needs its own build.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Error aaye toh pehle pehchaano **kis stage pe** aaya:

1. **Kuch bhi print nahi hua aur \`SyntaxError\` aaya?** Parsing stage. Error mein line number dekho — aksar galti us line se **ek line upar** hoti hai (missing bracket, quote, colon).
2. **Kuch output aaya, phir crash?** Runtime error. Traceback / stack trace ko **neeche se upar** padho: last line batati hai kya hua (\`NameError\`, \`TypeError\`), upar ki lines batati hain kahan.
3. **"command not found: python" ya "node is not recognized"?** Interpreter install nahi hai ya PATH mein nahi hai. \`python3 --version\` / \`node --version\` chalao.
4. **Compiled language mein linker error** (\`undefined reference\`)? Code compile hua par koi function/library milti nahi.
5. Doubt ho toh code ko chhota karo: aadha hata ke chalao, dekho error rehta hai ya jaata hai.`,
          en: `When you get an error, first find **which stage** it came from:

1. **Nothing printed and a \`SyntaxError\`?** Parsing stage. Check the line number — the real mistake is often **one line above** (missing bracket, quote or colon).
2. **Some output, then a crash?** Runtime error. Read the traceback / stack trace **from the bottom**: the last line says what happened (\`NameError\`, \`TypeError\`), the lines above say where.
3. **"command not found: python" or "node is not recognized"?** The interpreter is not installed or not on PATH. Run \`python3 --version\` / \`node --version\`.
4. **A linker error** (\`undefined reference\`) in a compiled language? The code compiled, but a function or library was not found.
5. Still stuck? Remove half the code and see if the error stays.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Koi approach "best" nahi hai — kaam ke hisaab se choose karo:

- **Compiled (C, C++, Go, Rust)**
  - Plus: sabse fast, kai errors pehle hi pakde jaate hain, ek single binary deploy karo.
  - Minus: har change ke baad build karna padta hai, har OS/CPU ke liye alag build.
- **Interpreted / VM-based (Python, JavaScript, Ruby)**
  - Plus: likho aur turant chalao, seekhna easy, ek hi code har jagah.
  - Minus: aam taur pe slow, kai errors tabhi dikhte hain jab wo line chalti hai.
- **Middle path**: Java aur C# bytecode mein compile hote hain aur JIT se fast chalte hain. TypeScript tumhe JS se pehle type errors pakadne deta hai.

Startup ke MVP ke liye Python/JS se jaldi banta hai; jab ek service pe crores requests aayein tab Go/Rust jaisa compiled option sochte hain.`,
          en: `No approach is "best" — choose based on the job:

- **Compiled (C, C++, Go, Rust)**
  - Pros: fastest, many errors are caught early, deploy a single binary.
  - Cons: rebuild after every change, separate builds for each OS/CPU.
- **Interpreted / VM-based (Python, JavaScript, Ruby)**
  - Pros: write and run immediately, easy to learn, the same code runs everywhere.
  - Cons: usually slower, many errors appear only when that line runs.
- **Middle path**: Java and C# compile to bytecode and use JIT. TypeScript catches type errors before the JavaScript runs.

For a startup MVP, Python or JS is quicker to build. When one service gets huge traffic, teams consider Go or Rust.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real project mein ye concept roz dikhta hai:

- **Node.js backend**: tum \`node server.js\` chalate ho. Server start hua, sab theek — phir ek user ne rare button dabaya aur \`TypeError: cannot read properties of undefined\` se server crash. Ye runtime error tha, isliye start pe nahi dikha. Isi wajah se teams **TypeScript** aur **tests** use karti hain — errors ko pehle pakadne ke liye.
- **Python Flask app**: deploy ke baad \`__pycache__\` folder dikhta hai — wahi bytecode hai. Ise git mein commit nahi karte (\`.gitignore\` mein daalte hain).
- **Go microservice**: CI pipeline \`go build\` karke ek binary banati hai aur Docker image mein daal deti hai. Server pe Go install karne ki zaroorat nahi.

Jab tum samajhte ho code kaise chalta hai, tum errors ko jaldi pakadte ho aur deployment ko better plan karte ho.`,
          en: `In real projects you see this every day:

- **Node.js backend**: you run \`node server.js\`. It starts fine — then a user clicks a rare button and the server crashes with \`TypeError: cannot read properties of undefined\`. It was a runtime error, so it did not show at startup. That is why teams use **TypeScript** and **tests** to catch errors earlier.
- **Python Flask app**: after running, you see a \`__pycache__\` folder — that is the bytecode. You add it to \`.gitignore\`.
- **Go microservice**: the CI pipeline runs \`go build\`, produces one binary and puts it in a Docker image. The server does not even need Go installed.`,
        },
      },
    ],
    visualization: {
      kind: "CODE_EXECUTION",
      title: "Source code se CPU tak (Python aur JavaScript)",
      steps: [
        { title: "Source code", description: "Tumhari .py ya .js file — bas text jo insaan padh sakte hain.", highlight: "total = price * qty" },
        { title: "Tokenize + Parse", description: "Text tokens mein tootta hai aur ek AST (tree) banta hai. Syntax galat hai toh yahin SyntaxError, kuch bhi nahi chalta.", highlight: "AST" },
        { title: "Bytecode", description: "AST ko simple bytecode instructions mein badla jaata hai. Python ise __pycache__ mein .pyc file ke roop mein save bhi karta hai.", highlight: "bytecode" },
        { title: "VM / Interpreter", description: "Virtual machine ek ek bytecode instruction chalati hai. Runtime errors (NameError, TypeError) yahan aate hain.", highlight: "runtime" },
        { title: "JIT (V8)", description: "Jo code baar baar chalta hai, V8 use fast machine code mein compile kar deta hai taaki agli baar seedha CPU pe chale.", highlight: "machine code" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which tool translates the whole program into machine code before it runs?",
        options: ["Interpreter", "Compiler", "Text editor", "Web browser"],
        correct: [1],
        explanation: "Compiler poora program pehle hi machine code mein badal deta hai (dubbing studio). Interpreter line by line chalata hai.",
        tags: ["compiler"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does a CPU directly understand?",
        options: ["Python code", "JavaScript code", "Machine code (binary instructions)", "English sentences"],
        correct: [2],
        explanation: "CPU sirf machine code samajhta hai. Python/JS ko pehle translate karna padta hai.",
        tags: ["basics"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "How does standard Python (CPython) run your .py file?",
        options: [
          "It compiles it to bytecode, and the Python virtual machine runs the bytecode",
          "It always compiles it into a .exe file first",
          "The web browser runs it",
          "The CPU reads the .py text directly",
        ],
        correct: [0],
        explanation: "CPython code ko bytecode mein badalta hai (isliye __pycache__ folder banta hai), phir Python VM us bytecode ko chalata hai.",
        tags: ["python"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these languages are usually compiled ahead of time into a native executable?",
        options: ["C", "Go", "Rust", "A Bash shell script"],
        correct: [0, 1, 2],
        explanation: "C, Go aur Rust compile hoke native binary banate hain. Bash script ko shell line by line interpret karta hai.",
        tags: ["languages"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What happens when this Python file runs?",
        code: `print("start")
x = 10
print(x)
print(y)
print("end")`,
        codeLanguage: "python",
        options: [
          "It prints start and 10, then fails with NameError",
          "Nothing prints; the error appears before running",
          "It prints start, 10 and end",
          "It prints only the NameError, nothing else",
        ],
        correct: [0],
        explanation: "Syntax sahi hai, isliye file chalna shuru hoti hai. 'start' aur 10 print hote hain. y kabhi bana hi nahi, toh print(y) pe runtime NameError — 'end' tak pahunchte hi nahi.",
        tags: ["runtime-error"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "You compiled a C program on your Mac and sent the binary to a friend on Windows. It does not run. Why?",
        options: [
          "Machine code is specific to the OS and CPU it was compiled for",
          "C is an interpreted language",
          "Your friend needs to install Python",
          "The file is too large for Windows",
        ],
        correct: [0],
        explanation: "Compiled binary ek specific OS + CPU ke liye banta hai. Windows ke liye Windows pe (ya cross-compile karke) alag build banana padega.",
        tags: ["compiler"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 3,
        prompt: "Put the steps in order for how the V8 engine runs a JavaScript file.",
        options: [
          "You write source code in a .js file",
          "The engine parses the code into an AST",
          "The AST is turned into bytecode and the interpreter starts running it",
          "Frequently run (hot) code is JIT-compiled into fast machine code",
        ],
        explanation: "Source → parse (AST) → bytecode + interpreter → hot code ka JIT compilation. Isliye JS jaldi start bhi hota hai aur baad mein fast bhi chalta hai.",
        tags: ["javascript", "jit"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain the difference between a compiler and an interpreter, including when each one reports errors.",
        keywords: ["whole program", "line by line", "machine code", "before running", "runtime"],
        explanation: "Compiler poora program pehle machine code mein badalta hai aur kai errors run se pehle bata deta hai. Interpreter line by line chalata hai, toh errors tab dikhte hain jab wo line run hoti hai.",
        tags: ["concepts"],
      },
    ],
    interview: [
      {
        question: "What is the difference between a compiled and an interpreted language?",
        short: "A compiled language is translated into machine code before it runs, producing an executable, so it is usually faster and catches many errors early. An interpreted language is executed by another program at run time, usually statement by statement. In practice many languages mix both, like Python with bytecode and JavaScript with JIT compilation.",
        deep: `- **Compiled** (C, Go, Rust): source → compiler → native binary. Fast start-up and execution; platform-specific builds.
- **Interpreted** (classic shells): an interpreter reads and executes code directly.
- **Hybrid** is the norm today:
  - **Python**: source → bytecode → Python VM.
  - **Java/C#**: source → bytecode → JVM/CLR with JIT.
  - **JavaScript (V8)**: parse → bytecode (Ignition) → hot paths JIT-compiled (TurboFan).
- Strictly, being "compiled" or "interpreted" is a property of the **implementation**, not the language.`,
        followUps: ["What is a JIT compiler?", "Is Java compiled or interpreted?", "What is bytecode?"],
        commonMistake: "Saying Python is not compiled at all, or that JavaScript is always slow.",
        keywords: ["machine code", "bytecode", "jit", "runtime"],
        difficulty: 2,
        roles: ["SDE", "BACKEND", "FULLSTACK"],
      },
      {
        question: "What is the difference between a syntax error and a runtime error?",
        short: "A syntax error means the code breaks the language's grammar, so it cannot even be parsed and nothing runs. A runtime error happens while the program is running, for example using an undefined variable or dividing by zero. With runtime errors, the code before the failing line has already run.",
        deep: `- **Syntax error**: caught during parsing. Example: missing \`)\` or \`:\`. The whole file fails to start.
- **Runtime error / exception**: the code is valid but fails during execution — \`NameError\`, \`TypeError\`, \`ZeroDivisionError\`.
- **Logical error**: no crash, but the output is wrong. The hardest to find; tests help.
- Static type checkers (TypeScript, mypy) move some runtime errors to before running.`,
        followUps: ["What is a logical error?", "How does TypeScript help catch errors earlier?"],
        commonMistake: "Assuming that if the program started without errors, all of it is correct.",
        keywords: ["parse", "grammar", "execution", "exception"],
        difficulty: 1,
        roles: ["SDE", "FULLSTACK", "FRONTEND"],
      },
    ],
  },
  // ───────────────────────────── terminal-basics ─────────────────────────────
  {
    slug: "terminal-basics",
    estMinutes: 25,
    difficulty: 1,
    prerequisites: ["operating-system-basics", "how-code-runs"],
    objectives: [
      "Explain what a terminal, shell and command are",
      "Use pwd, ls, cd, mkdir, touch, cat and rm with confidence",
      "Read a command as command + flags + arguments",
      "Recover from common terminal errors like 'command not found'",
    ],
    technicalDefinition:
      "A terminal is a text interface to a shell, a program (such as bash, zsh or PowerShell) that reads typed commands, parses them into a program name, options and arguments, and asks the operating system to run them.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Terminal** ek text wali window hai jahan tum computer ko **type karke commands** dete ho — mouse aur icons ke bina.

Teen words yaad rakho:

- **Terminal**: wo window jisme tum type karte ho (Mac pe Terminal / iTerm, Windows pe Windows Terminal, VS Code ke andar bhi ek terminal hota hai).
- **Shell**: andar chalne wala program jo tumhara command samajhta hai — jaise **bash**, **zsh**, ya **PowerShell**.
- **Command**: jo tum likhte ho, jaise \`ls\`, \`cd projects\`, \`python3 app.py\`.

Har command ka simple format hota hai: **\`command  -flags  arguments\`**. Jaise \`ls -la projects\` mein \`ls\` command hai, \`-la\` flags hain, aur \`projects\` argument hai.`,
          en: `A **terminal** is a text window where you give the computer **typed commands** — no mouse or icons.

Remember three words:

- **Terminal**: the window you type in (Terminal or iTerm on Mac, Windows Terminal on Windows, and one inside VS Code too).
- **Shell**: the program inside that understands your command — like **bash**, **zsh** or **PowerShell**.
- **Command**: what you type, like \`ls\`, \`cd projects\` or \`python3 app.py\`.

Most commands follow one format: **\`command  -flags  arguments\`**. In \`ls -la projects\`, \`ls\` is the command, \`-la\` are flags, and \`projects\` is the argument.`,
          hi: `**टर्मिनल** एक टेक्स्ट वाली विंडो है जहाँ तुम कंप्यूटर को **टाइप करके आदेश (commands)** देते हो — माउस और आइकन के बिना।

तीन शब्द याद रखो:

- **टर्मिनल**: वह विंडो जिसमें तुम टाइप करते हो।
- **शेल**: अंदर चलने वाला प्रोग्राम जो तुम्हारा आदेश समझता है — जैसे bash, zsh या PowerShell।
- **कमांड**: जो तुम लिखते हो, जैसे \`ls\` या \`cd projects\`।

ज़्यादातर कमांड का ढाँचा होता है: **कमांड, फिर फ़्लैग, फिर आर्गुमेंट**। जैसे \`ls -la projects\`।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Socho tum ek **chai tapri** pe ho.

- **Menu card wala tareeka (GUI)**: tum menu dekhte ho, ungli rakh ke batate ho "ye wala". Easy hai, par sirf wahi mil sakta hai jo menu pe chhapa hai.
- **Seedha bolne wala tareeka (Terminal)**: tum bolte ho — *"Bhaiya, 2 cutting chai, kam cheeni, ek mein adrak extra."* Ek line mein exact order, saare options ke saath.

Yahan:
- "chai" = **command** (kya chahiye)
- "kam cheeni", "adrak extra" = **flags** (kaise chahiye)
- "2 cutting" = **arguments** (kiske liye / kitna)

Aur **chaiwala bhaiya = shell** — jo tumhari baat samajhke kaam karwata hai. Agar tum bolo "bhaiya ek *chia* do", toh wo confuse ho jaayega — terminal mein isi ko \`command not found\` kehte hain!`,
          en: `Imagine you are at a **tea stall**.

- **Menu card way (GUI)**: you look at the menu and point at an item. It is easy, but you only get what is printed on the menu.
- **Speaking way (Terminal)**: you say, *"Two cutting chai, less sugar, extra ginger in one."* One line, an exact order, with all the options.

Here:
- "chai" = the **command** (what you want)
- "less sugar", "extra ginger" = the **flags** (how you want it)
- "two cutting" = the **arguments** (for what or how many)

The tea seller is the **shell** — he understands you and gets it done. If you say "one *chia* please", he gets confused. In a terminal, that is \`command not found\`.`,
          hi: `सोचो तुम एक **चाय की टपरी** पर हो।

- **मेन्यू कार्ड वाला तरीका (GUI)**: तुम मेन्यू पर उँगली रखकर बताते हो "यह वाला"। आसान है, पर सिर्फ़ वही मिलेगा जो छपा है।
- **सीधे बोलने वाला तरीका (टर्मिनल)**: तुम कहते हो — *"भैया, 2 कटिंग चाय, कम चीनी, एक में अदरक ज़्यादा।"* एक लाइन में पूरा ऑर्डर।

यहाँ "चाय" = **कमांड**, "कम चीनी" = **फ़्लैग**, "2 कटिंग" = **आर्गुमेंट**। और चायवाले भैया = **शेल**, जो तुम्हारी बात समझकर काम करवाते हैं।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `"Jab mouse se sab ho jaata hai toh terminal kyun?" — achha sawal. Reasons:

- **Servers pe screen hi nahi hoti.** AWS ya kisi bhi cloud server pe tum SSH karke sirf terminal se kaam karte ho. Koi desktop, koi icon nahi.
- **Developer tools terminal-first hain.** \`git\`, \`npm\`, \`pip\`, \`docker\`, \`python\`, \`node\` — sab commands hain.
- **Speed aur automation.** 500 files rename karni hain? GUI mein ghanta lagega, terminal mein ek line. Aur commands ko ek **script** mein likh ke baar baar chala sakte ho.
- **Repeatable.** "Ye 4 commands chalao" — kisi bhi teammate ko bhej do, same result. "Yahan click karo, phir wahan" ka screenshot nahi bhejna padta.

Bina terminal ke tum developer ke roop mein aadhe tools use hi nahi kar paoge.`,
          en: `"Why use a terminal when the mouse works?" Good question. Reasons:

- **Servers have no screen.** On AWS or any cloud server, you connect with SSH and work only in a terminal. No desktop, no icons.
- **Developer tools are terminal-first.** \`git\`, \`npm\`, \`pip\`, \`docker\`, \`python\`, \`node\` — all are commands.
- **Speed and automation.** Need to rename 500 files? It takes an hour with a mouse and one line in a terminal. You can save commands in a **script** and run them again.
- **Repeatable.** "Run these 4 commands" works the same for every teammate. No screenshots of "click here, then there".

Without the terminal, you cannot use half of a developer's tools.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Real companies mein terminal har din use hota hai:

- **GitHub**: code push karna (\`git push\`), naya branch banana, PR check karna — developers ye zyada tar terminal se karte hain. GitHub ka apna CLI bhi hai: \`gh\`.
- **AWS / Google Cloud**: Flipkart ya Swiggy jaise companies ke engineers servers pe SSH karke logs dekhte hain (\`tail -f app.log\`), aur \`aws\` / \`gcloud\` CLI se servers manage karte hain.
- **Vercel / Netlify**: frontend deploy karna literally ek command hai — \`vercel deploy\`. CI pipelines (GitHub Actions) bhi andar se sirf terminal commands chalate hain.

Interview mein bhi "Linux commands aate hain?" common sawal hai, especially DevOps aur backend roles ke liye.`,
          en: `Real companies use the terminal every day:

- **GitHub**: pushing code (\`git push\`), creating branches and checking PRs are mostly done from a terminal. GitHub even has its own CLI: \`gh\`.
- **AWS / Google Cloud**: engineers at companies like Flipkart or Swiggy SSH into servers to read logs (\`tail -f app.log\`) and manage servers with the \`aws\` or \`gcloud\` CLI.
- **Vercel / Netlify**: deploying a frontend is one command — \`vercel deploy\`. CI pipelines like GitHub Actions also just run terminal commands inside.

"Do you know Linux commands?" is a common interview question, especially for DevOps and backend roles.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Jab tum \`ls -la projects\` likh ke Enter dabate ho:

1. **Read**: shell poori line padhta hai.
2. **Parse**: line ko spaces pe todta hai → \`["ls", "-la", "projects"]\`. Pehla word = command, \`-\` se shuru = flags, baaki = arguments. Quotes (\`"my file.txt"\`) ek hi argument maane jaate hain.
3. **Find**: shell \`ls\` naam ka program dhoondta hai **PATH** variable mein listed folders mein (jaise \`/bin\`, \`/usr/bin\`). Nahi mila → \`command not found\`.
4. **Run**: OS ek naya **process** banata hai aur arguments pass karta hai. Program **current working directory** ke context mein chalta hai — isliye "kis folder mein ho" bahut matter karta hai.
5. **Output + exit code**: program text print karta hai aur ek **exit code** deta hai — \`0\` = success, kuch aur = error.

Phir shell naya prompt (\`$\`) dikhata hai aur agle command ka wait karta hai.`,
          en: `When you type \`ls -la projects\` and press Enter:

1. **Read**: the shell reads the whole line.
2. **Parse**: it splits the line on spaces → \`["ls", "-la", "projects"]\`. The first word is the command, words starting with \`-\` are flags, the rest are arguments. Quoted text (\`"my file.txt"\`) counts as one argument.
3. **Find**: the shell looks for a program named \`ls\` in the folders listed in the **PATH** variable (like \`/bin\` or \`/usr/bin\`). If not found → \`command not found\`.
4. **Run**: the OS starts a new **process** with those arguments. It runs in the **current working directory**, so the folder you are in matters.
5. **Output + exit code**: the program prints text and returns an **exit code** — \`0\` means success, anything else means an error.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Ye program ek **mini shell** simulate karta hai — ek nakli file system pe \`pwd\`, \`ls\`, \`mkdir\`, \`cd\` chalata hai.

1. \`fsTree\` ek nested object/dict hai: folders = objects, files = \`null\`/\`None\`.
2. \`cwd\` current folder ka rasta hai, list ke roop mein: \`["home", "ravi"]\`.
3. \`getDir\` us list ko follow karke current folder tak pahunchta hai.
4. \`run\` command ko \`split\` karke pehla word (command) aur doosra (argument) nikalta hai, phir matching kaam karta hai.
5. \`cd ..\` list ka last item hata deta hai (\`pop\`) — yani parent folder.
6. Last do commands errors dikhate hain: folder exist nahi karta, aur typo \`gti\` → \`command not found\`.`,
          en: `This program simulates a **mini shell** — it runs \`pwd\`, \`ls\`, \`mkdir\` and \`cd\` on a fake file system.

1. \`fsTree\` is a nested object/dict: folders are objects, files are \`null\`/\`None\`.
2. \`cwd\` is the path to the current folder as a list: \`["home", "ravi"]\`.
3. \`getDir\` follows that list to reach the current folder.
4. \`run\` splits the command into the first word (command) and the second (argument), then does the matching work.
5. \`cd ..\` removes the last item from the list (\`pop\`) — that is the parent folder.
6. The last two commands show errors: a folder that does not exist, and the typo \`gti\` → \`command not found\`.`,
        },
        codeJs: `// A fake file system: folders are objects, files are null
const fsTree = { home: { ravi: { projects: {}, "notes.txt": null } } };
const cwd = ["home", "ravi"];

function getDir(parts) {
  let node = fsTree;
  for (const p of parts) node = node[p];
  return node;
}

function run(line) {
  const [cmd, arg] = line.split(" ");
  console.log("$ " + line);
  const here = getDir(cwd);
  if (cmd === "pwd") {
    console.log("/" + cwd.join("/"));
  } else if (cmd === "ls") {
    console.log(Object.keys(here).sort().join("  "));
  } else if (cmd === "mkdir") {
    here[arg] = {};
  } else if (cmd === "cd") {
    const target = here[arg];
    if (arg === "..") cwd.pop();
    else if (target !== null && typeof target === "object") cwd.push(arg);
    else console.log("cd: no such directory: " + arg);
  } else {
    console.log(cmd + ": command not found");
  }
}

["pwd", "ls", "mkdir app", "cd app", "pwd", "cd ..", "ls", "cd music", "gti status"].forEach(run);
`,
        codePython: `# A fake file system: folders are dicts, files are None
fs_tree = {"home": {"ravi": {"projects": {}, "notes.txt": None}}}
cwd = ["home", "ravi"]


def get_dir(parts):
    node = fs_tree
    for p in parts:
        node = node[p]
    return node


def run(line):
    words = line.split(" ")
    cmd = words[0]
    arg = words[1] if len(words) > 1 else None
    print("$ " + line)
    here = get_dir(cwd)
    if cmd == "pwd":
        print("/" + "/".join(cwd))
    elif cmd == "ls":
        print("  ".join(sorted(here.keys())))
    elif cmd == "mkdir":
        here[arg] = {}
    elif cmd == "cd":
        if arg == "..":
            cwd.pop()
        elif isinstance(here.get(arg), dict):
            cwd.append(arg)
        else:
            print("cd: no such directory: " + str(arg))
    else:
        print(cmd + ": command not found")


for line in ["pwd", "ls", "mkdir app", "cd app", "pwd", "cd ..", "ls", "cd music", "gti status"]:
    run(line)
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Terminal mein beginners aksar ye karte hain:

- **Galat folder mein command chalana.** \`python3 app.py\` → "No such file". Pehle \`pwd\` aur \`ls\` se check karo tum kahan ho.
- **Space wale naam bina quotes ke.** \`cd My Projects\` do arguments ban jaate hain. Sahi: \`cd "My Projects"\`. Better: folder names mein space hi mat rakho.
- **\`rm -rf\` casually chalana.** Terminal mein **Recycle Bin nahi hota**. \`rm\` se delete = hamesha ke liye. Command dobara padho, phir Enter.
- **Case galat likhna.** Linux/Mac mein \`Desktop\` aur \`desktop\` alag hain.
- **Error ko padhe bina copy-paste karna.** Error message aksar exactly bata deta hai kya galat hai.
- **Internet se commands blindly chalana**, khaas kar \`sudo\` wale. Samjho phir chalao.`,
          en: `Beginners often do this in the terminal:

- **Running a command in the wrong folder.** \`python3 app.py\` → "No such file". First check with \`pwd\` and \`ls\`.
- **Names with spaces without quotes.** \`cd My Projects\` becomes two arguments. Correct: \`cd "My Projects"\`. Better: avoid spaces in folder names.
- **Using \`rm -rf\` casually.** There is **no Recycle Bin** in the terminal. \`rm\` deletes forever. Re-read before pressing Enter.
- **Wrong letter case.** On Linux/Mac, \`Desktop\` and \`desktop\` are different.
- **Ignoring the error message.** It often says exactly what is wrong.
- **Blindly running commands from the internet**, especially with \`sudo\`. Understand first.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Terminal error aaye toh ye checklist follow karo:

1. **\`command not found\`** → spelling check karo (\`gti\` vs \`git\`). Phir check karo tool install hai: \`which git\` (Mac/Linux) ya \`where git\` (Windows). Install hai par nahi mil raha → PATH ki problem.
2. **\`No such file or directory\`** → \`pwd\` se location dekho, \`ls\` se files dekho. Path ya case galat hai.
3. **\`Permission denied\`** → file pe permission nahi hai. \`ls -l\` se dekho. \`sudo\` sirf tab lagao jab samajh aaye kyun chahiye.
4. **Command atak gaya / ruk nahi raha** → \`Ctrl + C\` dabao, ye running program ko rok deta hai.
5. **Flag ka matlab nahi pata** → \`man ls\` ya \`ls --help\` chalao.
6. **Pichla command dobara chahiye** → Up arrow ↑. Aur \`Tab\` dabao auto-complete ke liye — typos kam honge.`,
          en: `When the terminal shows an error, use this checklist:

1. **\`command not found\`** → check spelling (\`gti\` vs \`git\`). Then check it is installed: \`which git\` (Mac/Linux) or \`where git\` (Windows). Installed but not found → a PATH problem.
2. **\`No such file or directory\`** → check your location with \`pwd\` and the files with \`ls\`. The path or letter case is wrong.
3. **\`Permission denied\`** → you lack permission on that file. Check with \`ls -l\`. Use \`sudo\` only when you understand why.
4. **A command is stuck** → press \`Ctrl + C\` to stop it.
5. **Unsure what a flag does** → run \`man ls\` or \`ls --help\`.
6. **Need the last command again** → press the Up arrow. Press \`Tab\` to auto-complete and avoid typos.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Terminal powerful hai, par har kaam ke liye best nahi:

- **GUI better hai jab**: photo edit karni ho, design dekhna ho, ya kisi naye tool ko explore karna ho jahan commands yaad nahi. VS Code ka Git panel bhi diffs dekhne ke liye bahut acha hai.
- **Terminal better hai jab**: kaam repeat hota ho, server pe ho, ya bahut files ek saath handle karni hon.
- **Risk**: terminal "Are you sure?" kam poochta hai. Ek galat \`rm\` ya galat server pe chala command bahut nuksaan kar sakta hai.
- **Shell differences**: bash/zsh (Mac, Linux) aur PowerShell (Windows) ke commands thode alag hain — \`ls\` vs \`dir\`, \`export\` vs \`$env:\`. Windows pe **WSL** ya **Git Bash** use karke Linux jaisa experience milta hai.

Best developers dono use karte hain — jo kaam jahan fast ho.`,
          en: `The terminal is powerful, but not best for every job:

- **GUI is better when** you edit photos, look at designs, or explore a new tool whose commands you do not know. VS Code's Git panel is great for viewing diffs.
- **Terminal is better when** the work repeats, you are on a server, or you handle many files at once.
- **Risk**: the terminal rarely asks "Are you sure?". One wrong \`rm\`, or a command run on the wrong server, can do real damage.
- **Shell differences**: bash/zsh (Mac, Linux) and PowerShell (Windows) differ — \`ls\` vs \`dir\`, \`export\` vs \`$env:\`. On Windows, **WSL** or **Git Bash** gives a Linux-like experience.

Good developers use both, whichever is faster.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Naya MERN ya Django project shuru karte waqt pehla din kuch aisa dikhta hai:

\`\`\`
mkdir campus-connect && cd campus-connect
git init
npm init -y
mkdir src && touch src/index.js
code .
\`\`\`

Phir roz ka kaam: \`npm run dev\` se server chalao, \`Ctrl + C\` se roko, \`git status\` aur \`git commit\` se save karo.

Deploy ke time: \`ssh ubuntu@server-ip\` karke server pe jaate ho, \`git pull\`, \`npm install\`, \`pm2 restart app\`. Server crash hua toh \`tail -f logs/error.log\` se live logs dekhte ho.

Ye saare commands ek **README** mein likh dete ho taaki naya teammate 5 minute mein project chala sake. Terminal hi developer ki asli "remote control" hai.`,
          en: `On day one of a new MERN or Django project, you type something like:

\`\`\`
mkdir campus-connect && cd campus-connect
git init
npm init -y
mkdir src && touch src/index.js
code .
\`\`\`

Daily work: start the server with \`npm run dev\`, stop it with \`Ctrl + C\`, and save work with \`git status\` and \`git commit\`.

At deploy time: \`ssh ubuntu@server-ip\` to reach the server, then \`git pull\`, \`npm install\`, \`pm2 restart app\`. If it crashes, \`tail -f logs/error.log\` shows live logs. You write these commands in a **README** so a new teammate can run the project in five minutes.`,
        },
      },
    ],
    visualization: {
      kind: "FLOW",
      title: "Enter dabane ke baad kya hota hai",
      steps: [
        { title: "Tum type karte ho", description: "Prompt pe likha: ls -la projects, aur Enter dabaya.", highlight: "ls -la projects" },
        { title: "Shell parse karta hai", description: "Line ko tukdon mein toda: command = ls, flags = -la, argument = projects.", highlight: "parse" },
        { title: "PATH mein dhoondna", description: "Shell /bin, /usr/bin jaise folders mein ls naam ka program dhoondta hai. Na mile toh 'command not found'.", highlight: "PATH" },
        { title: "Process chalta hai", description: "OS ls ko current folder ke context mein chalata hai aur arguments deta hai.", highlight: "process" },
        { title: "Output + exit code", description: "Files ki list print hoti hai, exit code 0 (success) milta hai, aur shell naya prompt dikhata hai.", highlight: "exit 0" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which command shows the folder you are currently in?",
        options: ["ls", "pwd", "cd", "mkdir"],
        correct: [1],
        explanation: "pwd = print working directory. ls files dikhata hai, cd folder badalta hai, mkdir naya folder banata hai.",
        tags: ["commands"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `cd ..` do?",
        options: [
          "Moves to the parent folder",
          "Deletes the current folder",
          "Goes to the home folder",
          "Lists all files",
        ],
        correct: [0],
        explanation: ".. ka matlab hai 'ek level upar' — parent folder. Home ke liye cd ~ ya sirf cd hota hai.",
        tags: ["commands"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "In the command `ls -la projects`, what is `-la`?",
        options: [
          "Flags (options) that change how ls behaves",
          "The name of a file",
          "A second command",
          "A comment",
        ],
        correct: [0],
        explanation: "'-' se shuru hone wale words flags hote hain. -l = long details, -a = hidden files bhi. projects argument hai.",
        tags: ["syntax"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these commands create or change something on disk?",
        options: ["mkdir photos", "touch index.js", "rm old.txt", "pwd"],
        correct: [0, 1, 2],
        explanation: "mkdir folder banata hai, touch file banata hai (ya timestamp update karta hai), rm delete karta hai. pwd sirf location batata hai, kuch change nahi karta.",
        tags: ["commands"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "A shell splits commands on whitespace. What does this Python code print?",
        code: `line = "git   commit -m fix"
parts = line.split()
print(parts[0], len(parts))`,
        codeLanguage: "python",
        options: ["git 4", "git 6", "git   4", "commit 3"],
        correct: [0],
        explanation: "split() bina argument ke multiple spaces ko ek maanta hai. parts = ['git', 'commit', '-m', 'fix'], toh output 'git 4'. Shell bhi aise hi words todta hai.",
        tags: ["parsing"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "You run `python3 app.py` and get 'No such file or directory', but you can see app.py in VS Code. What is the most likely reason?",
        options: [
          "The terminal is in a different folder from the one containing app.py",
          "Python is broken and must be reinstalled",
          "The internet is disconnected",
          "You must always use sudo to run Python",
        ],
        correct: [0],
        explanation: "Relative naam 'app.py' current folder mein dhoonda jaata hai. pwd aur ls chalao, phir cd karke sahi folder mein jao.",
        tags: ["debugging"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 1,
        prompt: "Put the steps in order to create a new project folder with a file inside it.",
        options: [
          "Open the terminal",
          "Run `mkdir my-app` to create a folder",
          "Run `cd my-app` to move into it",
          "Run `touch index.js` to create a file",
          "Run `ls` to confirm the file exists",
        ],
        explanation: "Pehle folder banao, phir uske andar jao, tab file banao — warna file galat jagah ban jaayegi. Last mein ls se confirm karo.",
        tags: ["workflow"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why do developers use the terminal even though graphical tools exist?",
        keywords: ["servers", "automate", "scripts", "faster", "tools"],
        explanation: "Servers pe GUI nahi hota, developer tools (git, npm, docker) commands hain, aur commands ko scripts mein daal ke automate aur repeat kar sakte ho. Repetitive kaam terminal mein bahut fast hai.",
        tags: ["concepts"],
      },
    ],
    buildTask: {
      title: "Mini command parser",
      description: `Shell sabse pehle tumhari line ko todta hai. Tum bhi wahi karo!

Function **\`parseCommand(line)\`** likho jo ek object/dict return kare:

- \`command\`: pehla word
- \`flags\`: baaki words jo \`-\` se shuru hote hain (order same rakho)
- \`args\`: baaki saare words (order same rakho)

Extra spaces ignore karo. Khaali line ke liye \`{ command: "", args: [], flags: [] }\`.

Example: \`"git commit -m hello"\` → \`{ command: "git", args: ["commit", "hello"], flags: ["-m"] }\``,
      functionName: "parseCommand",
      starterJs: `function parseCommand(line) {
  // TODO: split into words, then separate command, flags and args
}
`,
      starterPython: `def parseCommand(line):
    # TODO: split into words, then separate command, flags and args
    pass
`,
      tests: [
        { name: "just a command", args: ["ls"], expected: { command: "ls", args: [], flags: [] } },
        { name: "command with flag", args: ["ls -la"], expected: { command: "ls", args: [], flags: ["-la"] } },
        { name: "command with argument", args: ["mkdir projects"], expected: { command: "mkdir", args: ["projects"], flags: [] } },
        { name: "mixed flags and args", args: ["git commit -m hello"], expected: { command: "git", args: ["commit", "hello"], flags: ["-m"] } },
        { name: "extra spaces", args: ["  cp   -r src   dest  "], expected: { command: "cp", args: ["src", "dest"], flags: ["-r"] }, hidden: true },
        { name: "empty line", args: [""], expected: { command: "", args: [], flags: [] }, hidden: true },
      ],
      hints: [
        "Shell ki tarah socho: line ko whitespace pe words mein todo, khaali tukde hata do. Pehla word command hai.",
        "Words ki list khaali hai toh empty result return karo. Warna baaki words pe loop chalao: '-' se shuru → flags, nahi toh → args.",
        "JS: const words = line.trim().split(/\\s+/).filter(Boolean);  |  Python: words = line.split()  (bina argument ke split extra spaces khud handle karta hai)",
      ],
      explainQuestions: [
        { question: "How did you handle multiple spaces between words?", keywords: ["split", "whitespace", "empty", "filter", "trim"] },
        { question: "How do you decide whether a word is a flag or an argument?", keywords: ["starts with", "dash", "-", "check"] },
        { question: "What happens with an empty line, and why is that case special?", keywords: ["empty", "no words", "command", "default"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "What happens when you type a command in the terminal and press Enter?",
        short: "The shell reads the line, splits it into the command name, options and arguments, and looks for the program in the directories listed in the PATH variable. The operating system then starts it as a new process in the current working directory. The program prints its output and returns an exit code, where zero means success.",
        deep: `1. **Read & parse**: tokenize on whitespace, respect quotes, expand things like \`~\`, \`*\` and \`$VAR\`.
2. **Resolve**: built-ins (\`cd\`, \`export\`) run inside the shell itself; others are searched in **PATH**.
3. **Execute**: the shell forks a child process and execs the program with argv.
4. **I/O**: stdin, stdout and stderr connect to the terminal unless redirected (\`>\`, \`|\`).
5. **Exit status**: available as \`$?\`. Scripts and CI use it to decide success or failure.`,
        followUps: ["Why is cd a shell built-in and not a separate program?", "What is the PATH variable?", "What does an exit code of 1 mean?"],
        commonMistake: "Thinking the terminal and the shell are the same program.",
        keywords: ["shell", "path", "process", "exit code"],
        difficulty: 2,
        roles: ["DEVOPS", "BACKEND", "SDE"],
      },
      {
        question: "What is the difference between an absolute path and the current working directory in the terminal?",
        short: "The current working directory is the folder the shell is in right now, shown by pwd. Relative paths like app.py are resolved from it. An absolute path starts from the root, like /home/ravi/app.py, so it works no matter which folder you are in.",
        deep: `- \`pwd\` prints the current working directory (cwd). Every process inherits a cwd from the shell that started it.
- **Relative**: \`src/app.js\`, \`../config\` — depend on cwd.
- **Absolute**: \`/home/ravi/project/src/app.js\` — always the same file.
- Common bug: a script works when run from the project root but fails from another folder, because it opens files with relative paths. Fix by building paths from the script's own location.`,
        followUps: ["What does ~ mean?", "How can a script find files relative to itself?"],
        commonMistake: "Assuming a script's relative paths are relative to the script file, not to where it was run from.",
        keywords: ["pwd", "relative", "absolute", "root"],
        difficulty: 1,
        roles: ["DEVOPS", "BACKEND", "FULLSTACK"],
      },
    ],
    promptCard: {
      title: "Understand a confusing terminal error",
      category: "DEBUGGING",
      task: "Get a clear explanation and a safe fix for an error message from the terminal.",
      whenToUse: "When a terminal command fails with an error you do not understand, before you try random commands from the internet.",
      template: `I am a beginner developer using [OPERATING_SYSTEM] with the [SHELL_NAME] shell.

I ran this command from the folder [CURRENT_FOLDER]:
[COMMAND]

I got this error:
[ERROR_MESSAGE]

Please:
1. Explain in simple words what the error means.
2. List the 2–3 most likely causes, starting with the most common.
3. For each cause, give one command I can run to check it.
4. Give the fix, and warn me clearly if any command can delete data or needs sudo.
Do not suggest commands that delete files unless they are really needed.`,
      variables: [
        { key: "OPERATING_SYSTEM", label: "Your OS (e.g. macOS 15, Windows 11, Ubuntu 24.04)" },
        { key: "SHELL_NAME", label: "Shell (zsh, bash, PowerShell, Git Bash)" },
        { key: "CURRENT_FOLDER", label: "Output of pwd" },
        { key: "COMMAND", label: "The exact command you ran" },
        { key: "ERROR_MESSAGE", label: "The full error text, copied exactly" },
      ],
      whyItWorks: [
        { part: "OS and shell", why: "Commands differ between bash, zsh and PowerShell, so the AI can give commands that actually work on your machine." },
        { part: "Current folder", why: "Many errors are 'wrong folder' problems; giving pwd lets the AI spot that immediately." },
        { part: "Ask for checks before fixes", why: "You learn to verify the cause yourself instead of blindly running a fix." },
        { part: "Warning about delete/sudo", why: "Protects you from destructive commands, since the terminal has no undo." },
      ],
      verifyChecklist: [
        "Run the suggested check commands first and confirm the cause matches",
        "Look up any unfamiliar command with man or --help before running it",
        "Make sure no suggested command deletes files you need",
        "After the fix, re-run your original command and confirm the exit code is 0",
      ],
      sampleOutput: `**What it means:** "zsh: command not found: python" means zsh could not find a program called python in any folder listed in your PATH.

**Likely causes:**
1. On macOS, Python 3 is installed as python3, not python. Check: \`which python3\`
2. Python is not installed. Check: \`python3 --version\`

**Fix:** use \`python3 app.py\`. No sudo or deletion needed.`,
    },
  },
  // ───────────────────────────── files-and-paths ─────────────────────────────
  {
    slug: "files-and-paths",
    estMinutes: 20,
    difficulty: 1,
    prerequisites: ["terminal-basics"],
    objectives: [
      "Understand how files and folders form a tree starting from the root",
      "Tell absolute paths from relative paths and resolve . and ..",
      "Avoid cross-platform path bugs (slashes, case sensitivity, spaces)",
      "Normalize a messy path into a clean canonical path",
    ],
    technicalDefinition:
      "A file system organises files in a hierarchical tree of directories; a path is a string that identifies a location in that tree, either absolutely from the root or relative to the current working directory, using components such as '.', '..' and a separator ('/' on Unix, '\\' on Windows).",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**File** = data ka ek naam wala tukda — jaise \`resume.pdf\`, \`app.js\`, \`photo.jpg\`.
**Directory (folder)** = files aur doosre folders ka dabba.

Saare folders milke ek **tree** banate hain. Sabse upar **root** hota hai: Linux/Mac pe \`/\`, Windows pe \`C:\\\`.

**Path** = kisi file tak pahunchne ka **address**:

- **Absolute path**: root se shuru, poora address. Jaise \`/home/ravi/projects/app.js\`. Kahin se bhi same file milegi.
- **Relative path**: tum abhi jahan ho (current folder) wahan se address. Jaise \`projects/app.js\` ya \`../notes.txt\`.

Do special naam: \`.\` = current folder, \`..\` = parent folder (ek level upar).`,
          en: `A **file** is a named piece of data — like \`resume.pdf\`, \`app.js\` or \`photo.jpg\`.
A **directory (folder)** is a box that holds files and other folders.

All folders together form a **tree**. At the top is the **root**: \`/\` on Linux/Mac, \`C:\\\` on Windows.

A **path** is the **address** of a file:

- **Absolute path**: starts from the root, the full address. Like \`/home/ravi/projects/app.js\`. It finds the same file from anywhere.
- **Relative path**: an address starting from where you are now (the current folder). Like \`projects/app.js\` or \`../notes.txt\`.

Two special names: \`.\` means the current folder, \`..\` means the parent folder (one level up).`,
          hi: `**फ़ाइल** = डेटा का एक नाम वाला टुकड़ा — जैसे \`resume.pdf\` या \`app.js\`।
**डायरेक्टरी (फ़ोल्डर)** = फ़ाइलों और दूसरे फ़ोल्डरों का डिब्बा।

सारे फ़ोल्डर मिलकर एक **पेड़ (tree)** बनाते हैं। सबसे ऊपर **रूट** होता है: Linux/Mac पर \`/\`।

**पाथ** = किसी फ़ाइल तक पहुँचने का **पता**:

- **एब्सोल्यूट पाथ**: रूट से शुरू पूरा पता, जैसे \`/home/ravi/app.js\`।
- **रिलेटिव पाथ**: तुम अभी जहाँ हो, वहाँ से पता, जैसे \`../notes.txt\`।

\`.\` = मौजूदा फ़ोल्डर, \`..\` = एक स्तर ऊपर वाला फ़ोल्डर।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Socho tumhe kisi dost ke ghar ka **address** batana hai.

- **Absolute address**: "India → Maharashtra → Pune → Kothrud → Lane 4 → House 12." Ye address duniya mein kahin se bhi kaam karega — courier wala, Zomato delivery boy, koi bhi pahunch jaayega. Ye hai \`/india/maharashtra/pune/kothrud/lane-4/house-12\`.
- **Relative address**: tum already Kothrud mein khade ho, toh bolte ho "yahan se Lane 4, phir House 12." Ye sirf tab kaam karega jab sunne wala bhi Kothrud mein ho. Ye hai \`lane-4/house-12\`.
- **\`..\`** = "ek gali peeche jao" — Lane 4 se wapas Kothrud.

Agar tumne Mumbai mein khade dost ko relative address diya, toh wo galat jagah pahunchega. Terminal mein bhi **"No such file or directory"** aksar isi wajah se aata hai — address relative tha, par tum galat jagah se bol rahe the.`,
          en: `Imagine giving someone the **address** of a friend's house.

- **Absolute address**: "India → Maharashtra → Pune → Kothrud → Lane 4 → House 12." This works from anywhere in the world — any courier or delivery rider can reach it. It is like \`/india/maharashtra/pune/kothrud/lane-4/house-12\`.
- **Relative address**: you are already standing in Kothrud, so you say "from here, Lane 4, then House 12." It only works if the listener is also in Kothrud. It is like \`lane-4/house-12\`.
- **\`..\`** means "go back one street" — from Lane 4 back to Kothrud.

Give a relative address to a friend in Mumbai, and they reach the wrong place. The terminal's **"No such file or directory"** often happens for the same reason.`,
          hi: `सोचो तुम्हें किसी दोस्त के घर का **पता** बताना है।

- **पूरा पता (एब्सोल्यूट)**: "भारत → महाराष्ट्र → पुणे → कोथरूड → लेन 4 → मकान 12।" यह दुनिया में कहीं से भी काम करेगा।
- **रिलेटिव पता**: तुम पहले से कोथरूड में खड़े हो, तो कहते हो "यहाँ से लेन 4, फिर मकान 12।" यह तभी काम करेगा जब सुनने वाला भी कोथरूड में हो।
- **\`..\`** = "एक गली पीछे जाओ"।

अगर मुंबई में खड़े दोस्त को रिलेटिव पता दिया, तो वह ग़लत जगह पहुँचेगा। टर्मिनल में "No such file" अक्सर इसी वजह से आता है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Ek computer mein lakhs files hoti hain. Agar sab ek hi jagah padi hon, toh do problems:

- **Dhoondna impossible**: "report.pdf" naam ki 50 files ho sakti hain — kaunsi chahiye?
- **Naam takraayenge**: do projects dono mein \`index.js\` chahiye. Folders ke bina ek doosre ko overwrite kar denge.

Folders + paths ye solve karte hain: \`/college/sem3/report.pdf\` aur \`/internship/report.pdf\` dono alag aur clear hain.

Developer ke liye ye roz ka kaam hai: code \`import\` karta hai doosri files, config files padhta hai, images serve karta hai, uploads save karta hai. Har jagah **path** lagta hai. Path ki galti = "file not found", ya worse — galat file overwrite ho gayi. Aur security bugs bhi: agar user \`../../etc/passwd\` jaisa path bhej de aur tum check na karo, toh wo server ki secret files padh sakta hai (**path traversal attack**).`,
          en: `A computer has hundreds of thousands of files. If they were all in one place:

- **Finding things is impossible**: there could be 50 files named "report.pdf" — which one?
- **Names clash**: two projects both need \`index.js\`. Without folders, one would overwrite the other.

Folders and paths fix this: \`/college/sem3/report.pdf\` and \`/internship/report.pdf\` are clearly different.

For developers this is daily work: code imports other files, reads config, serves images and saves uploads. Every one of these needs a **path**. A path mistake means "file not found", or worse, the wrong file gets overwritten. It also causes security bugs: if a user sends a path like \`../../etc/passwd\` and you do not check it, they may read secret server files. This is a **path traversal attack**.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Paths har product mein chhupe hain:

- **Google Drive / Dropbox**: tumhare folders ka structure ek path tree hi hai — "My Drive / College / Sem 3 / DBMS notes.pdf". Share link andar se isi file ki ID/path pe point karta hai.
- **GitHub**: har file ka URL uska path hai — \`github.com/user/repo/blob/main/src/app.js\`. \`src/app.js\` repo ke root se relative path hai.
- **Next.js / React apps (Vercel)**: \`app/about/page.js\` file bana do, website pe \`/about\` page ban jaata hai. Folder path hi URL ban jaata hai — isko file-based routing kehte hain.

Websites ke URLs bhi path jaise hi dikhte hain (\`/products/shoes\`), kyunki web ka design Unix file paths se hi inspire tha.`,
          en: `Paths are hidden inside every product:

- **Google Drive / Dropbox**: your folder structure is a path tree — "My Drive / College / Sem 3 / DBMS notes.pdf". A share link points to that file's ID or path.
- **GitHub**: every file URL contains its path — \`github.com/user/repo/blob/main/src/app.js\`. Here \`src/app.js\` is relative to the repo root.
- **Next.js / React apps (Vercel)**: create \`app/about/page.js\` and your site gets an \`/about\` page. The folder path becomes the URL. This is called file-based routing.

Website URLs look like paths (\`/products/shoes\`) because the web was inspired by Unix file paths.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `OS path ko kaise samajhta hai? Bas **left se right, ek ek tukda**:

1. Path ko separator (\`/\`) pe todo: \`/home/ravi/../docs/./a.txt\` → \`home\`, \`ravi\`, \`..\`, \`docs\`, \`.\`, \`a.txt\`.
2. Shuru \`/\` se hai? Toh root se start. Nahi? Toh **current working directory** se start.
3. Har tukde pe:
   - normal naam → us folder ke andar jao
   - \`.\` → kuch mat karo (yahin raho)
   - \`..\` → ek level upar jao (root pe ho toh root hi raho)
   - khaali tukda (\`//\` se bana) → ignore
4. Result: \`/home/docs/a.txt\`. Isko **normalized** ya canonical path kehte hain.

Andar se OS har folder ko ek chhoti table ki tarah rakhta hai: "naam → kahan stored hai". Path follow karna = har table mein agla naam dhoondna. Ek bhi naam na mile → \`ENOENT\` (No such file or directory).`,
          en: `How does the OS understand a path? **Left to right, one piece at a time**:

1. Split on the separator (\`/\`): \`/home/ravi/../docs/./a.txt\` → \`home\`, \`ravi\`, \`..\`, \`docs\`, \`.\`, \`a.txt\`.
2. Starts with \`/\`? Begin at the root. Otherwise, begin at the **current working directory**.
3. For each piece:
   - a normal name → go into that folder
   - \`.\` → do nothing (stay here)
   - \`..\` → go up one level (at the root, stay at the root)
   - an empty piece (from \`//\`) → ignore
4. Result: \`/home/docs/a.txt\`. This is the **normalized** or canonical path.

Inside, the OS keeps each folder like a small table: "name → where it is stored". Following a path means looking up the next name in each table. If one is missing → \`ENOENT\` (No such file or directory).`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Ye program ek path ko uske parts mein todta hai — bina kisi library ke, taaki andar ka logic dikhe.

1. \`isAbsolute\` check karta hai path \`/\` se shuru hota hai ya nahi.
2. \`parts\` path ko \`/\` pe todke khaali tukde hata deta hai.
3. \`basename\` = last part (file ka naam). \`dirname\` = baaki sab (file kis folder mein hai).
4. \`extname\` = last \`.\` ke baad ka hissa. Dhyaan do: \`.bashrc\` jaisi hidden file ka extension nahi hota, isliye \`dot > 0\` check hai.
5. \`joinPath\` folder aur naam ko \`/\` se jodta hai, double slash se bachte hue.

Real projects mein Node ka \`path\` module aur Python ka \`os.path\` / \`pathlib\` yahi kaam karte hain — par andar ka idea yahi hai.`,
          en: `This program breaks a path into its parts — without any library, so you can see the logic.

1. \`isAbsolute\` checks whether the path starts with \`/\`.
2. \`parts\` splits the path on \`/\` and drops empty pieces.
3. \`basename\` is the last part (the file name). \`dirname\` is everything before it (the folder).
4. \`extname\` is the text after the last \`.\`. Note that a hidden file like \`.bashrc\` has no extension, which is why we check \`dot > 0\`.
5. \`joinPath\` joins a folder and a name with \`/\`, avoiding double slashes.

In real projects, Node's \`path\` module and Python's \`os.path\` / \`pathlib\` do this for you — but the idea inside is the same.`,
        },
        codeJs: `function isAbsolute(p) {
  return p.startsWith("/");
}

function parts(p) {
  return p.split("/").filter((s) => s !== "");
}

function basename(p) {
  const ps = parts(p);
  return ps[ps.length - 1];
}

function dirname(p) {
  const ps = parts(p).slice(0, -1);
  return (isAbsolute(p) ? "/" : "") + ps.join("/");
}

function extname(p) {
  const name = basename(p);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot) : "";
}

function joinPath(folder, name) {
  return folder.endsWith("/") ? folder + name : folder + "/" + name;
}

const file = "/home/ravi/projects/food-app/src/app.js";
console.log("absolute?", isAbsolute(file));
console.log("parts   :", parts(file));
console.log("dirname :", dirname(file));
console.log("basename:", basename(file));
console.log("extname :", extname(file));
console.log("hidden file ext:", JSON.stringify(extname("/home/ravi/.bashrc")));
console.log("relative?", !isAbsolute("src/app.js"));
console.log("join    :", joinPath("/home/ravi/", "notes.txt"));
`,
        codePython: `def is_absolute(p):
    return p.startswith("/")


def parts(p):
    return [s for s in p.split("/") if s != ""]


def basename(p):
    return parts(p)[-1]


def dirname(p):
    ps = parts(p)[:-1]
    return ("/" if is_absolute(p) else "") + "/".join(ps)


def extname(p):
    name = basename(p)
    dot = name.rfind(".")
    return name[dot:] if dot > 0 else ""


def join_path(folder, name):
    return folder + name if folder.endswith("/") else folder + "/" + name


file = "/home/ravi/projects/food-app/src/app.js"
print("absolute?", is_absolute(file))
print("parts   :", parts(file))
print("dirname :", dirname(file))
print("basename:", basename(file))
print("extname :", extname(file))
print("hidden file ext:", repr(extname("/home/ravi/.bashrc")))
print("relative?", not is_absolute("src/app.js"))
print("join    :", join_path("/home/ravi/", "notes.txt"))
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Paths ki common galtiyan:

- **Windows ka path hardcode karna**: \`"C:\\\\Users\\\\Ravi\\\\data.csv"\` — ye Linux server pe kabhi nahi chalega. Path functions use karo (\`path.join\`, \`pathlib\`).
- **Case ignore karna**: Windows/Mac pe \`Logo.PNG\` aur \`logo.png\` same chal jaate hain, Linux server pe nahi. Local pe chala, deploy pe image gayab!
- **String jod ke path banana**: \`folder + "/" + file\` — kabhi double slash, kabhi slash missing. Library function use karo.
- **Relative path ko script ke folder se relative samajhna**: relative path **jahan se command chalaya** wahan se resolve hota hai, script ki location se nahi.
- **User ka diya path seedha use karna**: \`../../\` se bahar nikal sakta hai. Hamesha normalize karke check karo ki path allowed folder ke andar hi hai.
- **Extension ko file type maan lena**: \`photo.jpg\` rename karke \`photo.pdf\` karne se wo PDF nahi ban jaati.`,
          en: `Common path mistakes:

- **Hardcoding Windows paths** like \`"C:\\\\Users\\\\Ravi\\\\data.csv"\` — this never works on a Linux server. Use path functions (\`path.join\`, \`pathlib\`).
- **Ignoring letter case**: on Windows/Mac \`Logo.PNG\` and \`logo.png\` both work, but not on a Linux server. Works locally, image missing after deploy!
- **Building paths by joining strings**: \`folder + "/" + file\` gives double or missing slashes. Use a library function.
- **Thinking relative paths are relative to the script**: they are resolved from **where you ran the command**, not where the script is.
- **Using a user-given path directly**: \`../../\` can escape your folder. Normalize it and check it stays inside the allowed folder.
- **Trusting the extension**: renaming \`photo.jpg\` to \`photo.pdf\` does not make it a PDF.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `"File not found" ya \`ENOENT\` error aaye toh:

1. **Exact path print karo** jo code use kar raha hai. Python: \`print(os.path.abspath(p))\`, Node: \`console.log(path.resolve(p))\`. Aksar yahin galti dikh jaati hai.
2. **Current working directory check karo**: Python \`os.getcwd()\`, Node \`process.cwd()\`, terminal mein \`pwd\`.
3. **Terminal mein \`ls\` karke dekho** file sach mein wahan hai, aur naam ka **case aur extension** match karta hai (\`data.CSV\` vs \`data.csv\`, ya chhupa hua \`.txt.txt\`).
4. **Script ki location se path banao**, cwd se nahi: Node mein \`path.join(__dirname, "data.csv")\` (CommonJS), Python mein \`Path(__file__).parent / "data.csv"\`.
5. **Permission denied?** File hai, par padhne ka haq nahi — \`ls -l\` se permissions dekho.
6. Path mein space ho toh terminal mein quotes lagao.`,
          en: `When you see "File not found" or \`ENOENT\`:

1. **Print the exact path** your code uses. Python: \`print(os.path.abspath(p))\`. Node: \`console.log(path.resolve(p))\`. The mistake is often obvious here.
2. **Check the current working directory**: Python \`os.getcwd()\`, Node \`process.cwd()\`, terminal \`pwd\`.
3. **Run \`ls\`** to confirm the file really exists and the **case and extension** match (\`data.CSV\` vs \`data.csv\`, or a hidden \`.txt.txt\`).
4. **Build paths from the script's location**, not the cwd: Node \`path.join(__dirname, "data.csv")\` (CommonJS), Python \`Path(__file__).parent / "data.csv"\`.
5. **Permission denied?** The file exists but you cannot read it — check with \`ls -l\`.
6. Put quotes around paths with spaces in the terminal.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Absolute ya relative — kab kya?

- **Absolute path**
  - Plus: confusion nahi, kahin se bhi same file.
  - Minus: machine-specific. \`/Users/ravi/project\` tumhare laptop pe hai, teammate ya server pe nahi. Code mein hardcode karna = doosron ke liye break.
- **Relative path**
  - Plus: project portable rehta hai — repo clone karo aur chalao.
  - Minus: cwd pe depend karta hai, galat folder se chalaya toh fail.

**Best practice**: code mein paths **project root ya script location** se relative banao, aur machine-specific cheezein (jaise upload folder) **environment variables** ya config file se lo.

Files vs database: chhota config ya logs files mein theek hai, par users, orders jaisa data — jisme search, update aur bahut saare log ek saath likhte hain — database mein rakho. Badi files (images, videos) cloud storage (S3) mein.`,
          en: `Absolute or relative — when to use which?

- **Absolute path**
  - Pros: no confusion, the same file from anywhere.
  - Cons: machine-specific. \`/Users/ravi/project\` exists on your laptop, not on a teammate's or the server. Hardcoding it breaks things for others.
- **Relative path**
  - Pros: the project stays portable — clone the repo and run it.
  - Cons: depends on the cwd and fails from the wrong folder.

**Best practice**: build paths relative to the **project root or script location**, and take machine-specific values (like an upload folder) from **environment variables** or a config file.

Files vs database: small config or logs are fine as files, but data like users and orders belongs in a database. Large files (images, videos) go to cloud storage like S3.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek typical Node/React project ka structure:

\`\`\`
food-app/
  package.json
  .env
  src/
    server.js
    routes/orders.js
    utils/format.js
  public/
    images/logo.png
  uploads/
\`\`\`

- \`routes/orders.js\` mein \`import { formatPrice } from "../utils/format.js"\` — relative path, \`..\` se \`src\` pe aaye, phir \`utils\` mein gaye.
- Frontend mein \`<img src="/images/logo.png">\` — ye **URL path** hai, server ise \`public/images/logo.png\` se map karta hai.
- User profile photo upload karta hai: server \`uploads/\` + safe filename mein save karta hai. User ka diya naam seedha use nahi karte — \`../../server.js\` jaisa naam bhej ke koi tumhari file overwrite kar sakta hai. Isliye path **normalize** karke check karte hain — yahi is topic ka build task hai.`,
          en: `A typical Node/React project layout:

\`\`\`
food-app/
  package.json
  .env
  src/
    server.js
    routes/orders.js
    utils/format.js
  public/
    images/logo.png
  uploads/
\`\`\`

- \`routes/orders.js\` has \`import { formatPrice } from "../utils/format.js"\` — a relative path: \`..\` goes up to \`src\`, then into \`utils\`.
- The frontend uses \`<img src="/images/logo.png">\` — a **URL path** that the server maps to \`public/images/logo.png\`.
- When a user uploads a profile photo, the server saves it in \`uploads/\` with a safe name. A name like \`../../server.js\` could overwrite your code, so the path is **normalized** and checked — that is this topic's build task.`,
        },
      },
    ],
    visualization: {
      kind: "TREE",
      title: "../images/logo.png ko /site/pages se resolve karna",
      steps: [
        { title: "Tree dekho", description: "Root / ke andar site hai, site ke andar pages aur images folders hain.", highlight: "/" },
        { title: "Start point", description: "Path relative hai (/ se shuru nahi), toh hum current folder /site/pages se shuru karte hain.", highlight: "/site/pages" },
        { title: ".. = ek level upar", description: "Pehla tukda .. hai, toh pages se nikal ke parent /site pe aa gaye.", highlight: "/site" },
        { title: "images mein jao", description: "Agla tukda images hai, toh /site/images folder ke andar gaye.", highlight: "/site/images" },
        { title: "File mil gayi", description: "Last tukda logo.png hai. Final absolute path: /site/images/logo.png.", highlight: "/site/images/logo.png" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which of these is an absolute path on Linux or macOS?",
        options: ["docs/resume.pdf", "./docs/resume.pdf", "/home/ravi/docs/resume.pdf", "../resume.pdf"],
        correct: [2],
        explanation: "Absolute path root '/' se shuru hota hai. Baaki sab current folder pe depend karte hain, isliye relative hain.",
        tags: ["paths"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "In a path, what does `..` mean?",
        options: ["The current folder", "The parent folder (one level up)", "The home folder", "The root folder"],
        correct: [1],
        explanation: ".. = ek level upar, yani parent folder. Single dot '.' current folder hai.",
        tags: ["paths"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "On Linux and macOS terminals, what does `~` usually mean?",
        options: ["The root folder", "The current user's home folder", "The temporary folder", "The previous folder"],
        correct: [1],
        explanation: "~ shell ka shortcut hai tumhare home folder ke liye, jaise /home/ravi ya /Users/ravi. Previous folder ke liye 'cd -' hota hai.",
        tags: ["paths", "terminal"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which statements are true?",
        options: [
          "On Linux, Photo.jpg and photo.jpg are two different files",
          "Windows uses the backslash \\ as its main path separator",
          "A relative path depends on the current working directory",
          "Changing a file's extension changes what is inside the file",
        ],
        correct: [0, 1, 2],
        explanation: "Linux case-sensitive hai, Windows backslash use karta hai, aur relative path cwd pe depend karta hai. Extension sirf naam ka hissa hai — andar ka data nahi badalta.",
        tags: ["paths"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this Node.js code print?",
        code: `const path = require("path").posix;
console.log(path.join("/app/src", "../config", "db.json"));`,
        codeLanguage: "javascript",
        options: ["/app/config/db.json", "/app/src/../config/db.json", "/config/db.json", "/app/src/config/db.json"],
        correct: [0],
        explanation: "path.join tukde jodta hai aur normalize bhi karta hai. /app/src se .. karke /app aaye, phir config/db.json → /app/config/db.json.",
        tags: ["code"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "Your code opens `Data/Users.csv`. It works on your Windows laptop but crashes on the Linux server, where the file is named `data/users.csv`. Why?",
        options: [
          "Linux file names are case-sensitive, so Data/Users.csv does not match data/users.csv",
          "Linux cannot read CSV files",
          "The server needs a GUI to open files",
          "Relative paths are not allowed on Linux",
        ],
        correct: [0],
        explanation: "Windows case ignore kar deta hai, Linux nahi. Naam ka case exactly match karo — aur best hai sab lowercase rakho.",
        tags: ["cross-platform"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "You are in /site/pages. Put the steps in order to resolve the path ../images/logo.png.",
        options: [
          "Start at the current folder /site/pages",
          "`..` moves up to /site",
          "Go into images → /site/images",
          "Pick the file logo.png → /site/images/logo.png",
        ],
        explanation: "Relative path current folder se shuru hota hai, phir left se right har tukda follow karte hain: .. upar, images andar, logo.png file.",
        tags: ["resolution"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Explain the difference between an absolute path and a relative path, with an example of when a relative path can break.",
        keywords: ["root", "current directory", "full path", "depends", "different folder"],
        explanation: "Absolute path root se poora address hai, kahin se bhi kaam karta hai. Relative path current directory pe depend karta hai — script ko different folder se chalaya toh wahi relative path galat file ya 'not found' dega.",
        tags: ["concepts"],
      },
    ],
    buildTask: {
      title: "Path normalizer",
      description: `Function **\`normalizePath(path)\`** likho. Input hamesha ek **absolute** Unix path hai (\`/\` se shuru). Output uska clean (canonical) version:

- \`.\` hata do (current folder)
- \`..\` pe ek folder peeche jao — root pe ho toh root hi raho
- multiple slashes (\`//\`) ko ek maano
- end mein slash nahi (sirf root \`"/"\` ho toh \`"/"\`)

Examples:
- \`"/home/user/../docs"\` → \`"/home/docs"\`
- \`"/a/./b/"\` → \`"/a/b"\`
- \`"/../"\` → \`"/"\``,
      functionName: "normalizePath",
      starterJs: `function normalizePath(path) {
  // TODO: split on "/", walk the pieces with a stack
}
`,
      starterPython: `def normalizePath(path):
    # TODO: split on "/", walk the pieces with a stack
    pass
`,
      tests: [
        { name: "parent folder", args: ["/home/user/../docs"], expected: "/home/docs" },
        { name: "dot and trailing slash", args: ["/a/./b/"], expected: "/a/b" },
        { name: "cannot go above root", args: ["/../"], expected: "/" },
        { name: "multiple slashes", args: ["//usr///bin"], expected: "/usr/bin" },
        { name: "two levels up", args: ["/a/b/c/../../d"], expected: "/a/d", hidden: true },
        { name: "only a dot", args: ["/."], expected: "/", hidden: true },
        { name: "ends with ..", args: ["/x/y/.."], expected: "/x" },
      ],
      hints: [
        "Stack (list) socho: har folder naam push karo, '..' pe pop karo. Stack hi final rasta hai.",
        "Path ko '/' pe todo. Har tukde ke liye: khaali ya '.' → skip; '..' → stack khaali nahi hai toh pop; warna push. End mein '/' + stack ke items '/' se jodo.",
        "JS: for (const part of path.split('/')) { if (part === '' || part === '.') continue; if (part === '..') { stack.pop(); continue; } stack.push(part); } return '/' + stack.join('/');",
      ],
      explainQuestions: [
        { question: "Why is a stack a good fit for handling '..'?", keywords: ["stack", "pop", "last folder", "parent"] },
        { question: "What does your code do with '..' when you are already at the root?", keywords: ["root", "empty", "stay", "ignore"] },
        { question: "How does your code handle '//' and '.'?", keywords: ["empty", "skip", "split", "current"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "What is a path traversal attack and how do you prevent it?",
        short: "Path traversal is when an attacker passes a path like ../../etc/passwd to make the server read or write files outside the allowed folder. To prevent it, never use user input directly as a path: resolve and normalize the full path, then check that it still starts with the allowed base directory, or better, generate safe file names yourself.",
        deep: `- **Attack**: \`GET /download?file=../../etc/passwd\` → server does \`readFile("uploads/" + file)\`.
- **Prevention**:
  1. Resolve: \`full = path.resolve(BASE, userInput)\`.
  2. Check: \`full.startsWith(BASE + path.sep)\` — otherwise reject.
  3. Prefer server-generated names (UUIDs) and store the original name in the database.
  4. Run the app with least-privilege file permissions.
- Also watch for encoded forms like \`%2e%2e%2f\`.`,
        followUps: ["Why is checking for '..' in the string not enough?", "How would you store user uploads safely?"],
        commonMistake: "Only blocking the literal string '../' instead of normalizing and checking the final resolved path.",
        keywords: ["normalize", "base directory", "user input", "../"],
        difficulty: 3,
        roles: ["BACKEND", "FULLSTACK", "SDE"],
      },
      {
        question: "Why should you avoid hardcoding file paths in your code?",
        short: "Hardcoded paths are tied to one machine and one operating system, so the code breaks on a teammate's laptop, in Docker or on a Linux server. Build paths with path utilities relative to the project or script location, and read machine-specific locations from configuration or environment variables.",
        deep: `- \`/Users/ravi/project/data.csv\` exists only on Ravi's Mac.
- Windows uses \`\\\` and drive letters; Linux uses \`/\` and is case-sensitive.
- Use \`path.join\` / \`pathlib.Path\` so separators are correct.
- Anchor to the code: \`__dirname\` (CommonJS), \`import.meta.url\` (ESM), \`Path(__file__).parent\` (Python).
- Use env vars like \`UPLOAD_DIR\` for deploy-specific locations (12-factor config).`,
        followUps: ["How do you get the directory of the current file in Node.js ES modules?", "What is the 12-factor app idea about config?"],
        commonMistake: "Using paths relative to the current working directory and assuming the script is always run from the project root.",
        keywords: ["portable", "path.join", "environment variable", "relative"],
        difficulty: 1,
        roles: ["BACKEND", "DEVOPS", "FULLSTACK"],
      },
    ],
  },
  // ───────────────────────────── git-basics ─────────────────────────────
  {
    slug: "git-basics",
    estMinutes: 30,
    difficulty: 2,
    prerequisites: ["terminal-basics", "files-and-paths"],
    objectives: [
      "Explain what version control is and why every team uses Git",
      "Use the init → add → commit → log workflow confidently",
      "Understand the working directory, staging area and repository",
      "Decide what should and should not be committed (.gitignore)",
    ],
    technicalDefinition:
      "Git is a distributed version control system that records snapshots of a project as commits, each identified by a content hash and linked to its parent commits, with a staging area (index) used to choose which changes go into the next commit.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Git** ek **version control system** hai — ek tool jo tumhare project ki **history** save karta hai.

Har baar jab tum bolte ho "ye kaam ho gaya, save karo", Git ek **commit** banata hai: poore project ka ek **snapshot (photo)**, ek message ke saath, jaise *"Add login page"*.

Iske fayde:

- Kabhi bhi kisi bhi purane version pe **wapas ja sakte ho**.
- Dekh sakte ho **kisne, kab, kya badla**.
- Kai log ek hi project pe **saath kaam** kar sakte hain bina ek doosre ka code udaaye.

Teen basic commands: \`git init\` (repo shuru karo), \`git add\` (changes select karo), \`git commit\` (snapshot save karo).

Dhyaan do: **Git ≠ GitHub.** Git tumhare laptop pe chalne wala tool hai; GitHub ek website hai jahan Git repos online rakhe jaate hain.`,
          en: `**Git** is a **version control system** — a tool that saves the **history** of your project.

Each time you say "this work is done, save it", Git creates a **commit**: a **snapshot** of the whole project with a message, like *"Add login page"*.

Benefits:

- You can **go back** to any old version at any time.
- You can see **who changed what, and when**.
- Many people can **work together** on one project without destroying each other's code.

Three basic commands: \`git init\` (start a repo), \`git add\` (choose changes), \`git commit\` (save a snapshot).

Note: **Git is not GitHub.** Git is a tool on your laptop; GitHub is a website that hosts Git repositories online.`,
          hi: `**Git** एक **वर्ज़न कंट्रोल सिस्टम** है — एक टूल जो तुम्हारे प्रोजेक्ट का **इतिहास** सहेजता है।

हर बार जब तुम कहते हो "यह काम हो गया, सेव करो", Git एक **कमिट** बनाता है: पूरे प्रोजेक्ट की एक **तस्वीर (snapshot)**, एक संदेश के साथ।

इसके फ़ायदे:

- किसी भी पुराने वर्ज़न पर **वापस जा सकते हो**।
- देख सकते हो **किसने, कब, क्या बदला**।
- कई लोग एक ही प्रोजेक्ट पर **साथ काम** कर सकते हैं।

ध्यान दो: Git तुम्हारे लैपटॉप का टूल है; GitHub एक वेबसाइट है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Shaadi ka photographer** socho.

- **Working directory = stage pe chal raha function.** Log aa rahe hain, ja rahe hain, sab badal raha hai.
- **Staging area (\`git add\`) = photographer bolta hai "Mama ji, Bua ji, aap log idhar aa jaiye!"** Tum chunte ho ki is photo mein kaun aayega. Sab log nahi, sirf selected.
- **Commit (\`git commit\`) = click!** Photo khinch gayi aur album mein lag gayi, neeche caption ke saath: *"Varmala ke baad, family photo"*.
- **\`git log\` = album palatna.** Pehli photo se last tak, poori kahani.

Ab agar baad mein kuch gadbad ho jaaye, album mein purani photo toh hamesha rahegi. Git mein bhi — code toot gaya? Purane commit pe wapas jao.

Aur **GitHub = album ki cloud copy**, taaki laptop kho jaaye tab bhi photos safe rahein aur rishtedaar bhi dekh sakein.`,
          en: `Think of a **wedding photographer**.

- **Working directory = the function happening on stage.** People come and go; everything keeps changing.
- **Staging area (\`git add\`) = the photographer calling, "Uncle, Aunty, please come here!"** You choose who will be in this photo. Not everyone — only the selected people.
- **Commit (\`git commit\`) = click!** The photo is taken and placed in the album with a caption: *"Family photo after the varmala"*.
- **\`git log\` = flipping through the album**, from the first photo to the last.

If something goes wrong later, the old photos are still in the album. In Git too — broke your code? Go back to an older commit.

**GitHub is the cloud copy of the album**, safe even if your laptop is lost.`,
          hi: `**शादी के फ़ोटोग्राफ़र** को सोचो।

- **वर्किंग डायरेक्टरी = स्टेज पर चल रहा समारोह।** लोग आ रहे हैं, जा रहे हैं, सब बदल रहा है।
- **स्टेजिंग एरिया (\`git add\`) = फ़ोटोग्राफ़र कहता है "मामा जी, बुआ जी, इधर आ जाइए!"** तुम चुनते हो कि इस फ़ोटो में कौन आएगा।
- **कमिट (\`git commit\`) = क्लिक!** फ़ोटो खिंच गई और एल्बम में कैप्शन के साथ लग गई।
- **\`git log\` = एल्बम पलटना।**

बाद में कुछ गड़बड़ हो, तो पुरानी फ़ोटो एल्बम में हमेशा रहेगी।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Git ke bina project kaisa dikhta hai? Kuch aisa:

\`\`\`
project_final.zip
project_final_v2.zip
project_final_v2_REAL.zip
project_final_v2_REAL_sir_changes.zip
\`\`\`

Problems:

- **Kaunsa latest hai?** Kisi ko nahi pata.
- **Kya badla?** Do zip files compare karna nightmare hai.
- **Team work?** Ravi ne \`login.js\` badla, Priya ne bhi — WhatsApp pe files bhejte bhejte kisi ka kaam overwrite ho gaya.
- **Galti ho gayi?** Kal tak sab chal raha tha, aaj nahi — par kal wala code kahan hai?

Git ye sab solve karta hai: ek folder, poori history, har change ka record, aur ek se zyada logon ke changes ko **merge** karne ka tareeka. Isliye aaj har software company — 2 log ki startup se lekar Google tak — Git use karti hai. Bina Git ke internship ka pehla din bhi mushkil hai.`,
          en: `Without Git, a project often looks like this:

\`\`\`
project_final.zip
project_final_v2.zip
project_final_v2_REAL.zip
project_final_v2_REAL_sir_changes.zip
\`\`\`

Problems:

- **Which one is latest?** Nobody knows.
- **What changed?** Comparing two zip files is a nightmare.
- **Teamwork?** Ravi and Priya both edit \`login.js\`, send files on WhatsApp, and someone's work gets overwritten.
- **Made a mistake?** It worked yesterday, not today — but where is yesterday's code?

Git solves all of this: one folder, the full history, a record of every change, and a way to **merge** changes from many people. That is why every software company — from a two-person startup to Google — uses Git.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Git har jagah hai:

- **GitHub / GitLab / Bitbucket**: Git repos ko online host karte hain. Microsoft, Google, Razorpay jaisi companies ke open-source projects GitHub pe hain — tum unki poori commit history dekh sakte ho.
- **Linux kernel**: Git banaya hi Linus Torvalds ne 2005 mein Linux ke liye tha, jahan hazaaron developers ek saath kaam karte hain.
- **Zerodha, Swiggy, Flipkart jaise companies**: har feature ek **branch** pe banta hai, phir **pull request** se review hota hai, aur merge hone ke baad CI/CD automatically test aur deploy karta hai. Sab Git ke upar.
- **Vercel / Netlify**: tum \`git push\` karte ho aur website automatically deploy ho jaati hai.

Recruiters bhi tumhara GitHub profile dekhte hain — regular, saaf commits achhi impression dete hain.`,
          en: `Git is everywhere:

- **GitHub / GitLab / Bitbucket** host Git repositories online. Open-source projects from Microsoft, Google and Razorpay live on GitHub — you can read their full commit history.
- **Linux kernel**: Linus Torvalds created Git in 2005 for Linux, where thousands of developers work together.
- **Companies like Zerodha, Swiggy and Flipkart**: each feature is built on a **branch**, reviewed through a **pull request**, and after merging, CI/CD tests and deploys it automatically. All built on Git.
- **Vercel / Netlify**: you run \`git push\` and the website deploys automatically.

Recruiters also look at your GitHub profile — regular, clean commits make a good impression.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Git ke andar teen "jagah" hoti hain:

1. **Working directory**: tumhari normal files jinhe tum edit karte ho.
2. **Staging area (index)**: \`git add\` ke baad changes yahan aate hain — "agle commit mein ye jaayega".
3. **Repository (\`.git\` folder)**: \`git commit\` ke baad snapshot yahan permanently save hota hai.

Har commit mein hota hai:
- poore project ka **snapshot** (sirf diff nahi — unchanged files ke liye pichli copy ka reference)
- **message**, **author**, **time**
- **parent** commit ka pointer — isi se history ek chain banti hai
- ek **ID (hash)** jaise \`a1b2c3d\`, jo content se calculate hota hai. Content badla = hash badla, isliye history ke saath chhed-chhaad pakdi jaati hai.

**HEAD** ek pointer hai jo batata hai tum abhi kis commit/branch pe ho. **Branch** bhi bas ek naam wala pointer hai jo kisi commit ko point karta hai.`,
          en: `Git has three "places":

1. **Working directory**: your normal files that you edit.
2. **Staging area (index)**: after \`git add\`, changes wait here — "this goes into the next commit".
3. **Repository (\`.git\` folder)**: after \`git commit\`, the snapshot is saved here permanently.

Each commit contains:
- a **snapshot** of the whole project (unchanged files just point to earlier copies)
- a **message**, **author** and **time**
- a pointer to its **parent** commit — this forms the history chain
- an **ID (hash)** like \`a1b2c3d\`, calculated from the content. If the content changes, the hash changes, so tampering with history is detected.

**HEAD** is a pointer to the commit or branch you are on now. A **branch** is just a named pointer to a commit.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Ye program Git ka ek **mini model** hai — staging area, commits aur log.

1. \`shortHash\` text se ek chhota ID banata hai. Asli Git SHA-1/SHA-256 use karta hai; idea same hai — content se ID.
2. \`repo\` mein teen cheezein: \`staged\` (staging area), \`files\` (last commit ki files), \`commits\` (history).
3. \`add\` file ko staging area mein daalta hai.
4. \`commit\` purani files + staged changes ko milake naya **snapshot** banata hai, parent ID jodta hai, aur staging khaali karta hai. Kuch staged nahi → "nothing to commit".
5. \`log\` commits ko naye se purane order mein dikhata hai.
6. Last mein hum pehle commit ka snapshot dekhte hain — "time travel".`,
          en: `This program is a **mini model** of Git — staging area, commits and log.

1. \`shortHash\` makes a short ID from text. Real Git uses SHA-1/SHA-256; the idea is the same — an ID from content.
2. \`repo\` holds \`staged\` (the staging area), \`files\` (files in the last commit) and \`commits\` (history).
3. \`add\` puts a file into the staging area.
4. \`commit\` merges old files with staged changes into a new **snapshot**, links the parent ID and clears staging. Nothing staged → "nothing to commit".
5. \`log\` shows commits from newest to oldest.
6. Finally we look at the first commit's snapshot — "time travel".`,
        },
        codeJs: `function shortHash(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 4294967296;
  return h.toString(16).padStart(8, "0").slice(0, 7);
}

const repo = { staged: {}, files: {}, commits: [] };

function add(name, content) {
  repo.staged[name] = content;
  console.log("git add " + name);
}

function commit(message) {
  if (Object.keys(repo.staged).length === 0) {
    console.log("nothing to commit");
    return;
  }
  const snapshot = Object.assign({}, repo.files, repo.staged);
  const last = repo.commits[repo.commits.length - 1];
  const parent = last ? last.id : "none";
  const id = shortHash(message + JSON.stringify(snapshot) + parent);
  repo.commits.push({ id, message, parent, snapshot });
  repo.files = snapshot;
  repo.staged = {};
  console.log("[" + id + "] " + message);
}

function log() {
  console.log("--- git log ---");
  for (let i = repo.commits.length - 1; i >= 0; i--) {
    const c = repo.commits[i];
    console.log(c.id + "  " + c.message + "  (parent: " + c.parent + ")");
  }
}

add("index.html", "<h1>Hello</h1>");
commit("Add home page");
add("style.css", "h1 { color: red }");
commit("Add styles");
commit("Empty commit?");
add("index.html", "<h1>Namaste</h1>");
commit("Change greeting");
log();

const first = repo.commits[0];
console.log("Time travel to " + first.id + ":", JSON.stringify(first.snapshot));
console.log("Latest files:", Object.keys(repo.files).join(", "));
`,
        codePython: `import json


def short_hash(text):
    h = 0
    for ch in text:
        h = (h * 31 + ord(ch)) % 4294967296
    return format(h, "08x")[:7]


repo = {"staged": {}, "files": {}, "commits": []}


def add(name, content):
    repo["staged"][name] = content
    print("git add " + name)


def commit(message):
    if not repo["staged"]:
        print("nothing to commit")
        return
    snapshot = {**repo["files"], **repo["staged"]}
    parent = repo["commits"][-1]["id"] if repo["commits"] else "none"
    commit_id = short_hash(message + json.dumps(snapshot) + parent)
    repo["commits"].append({"id": commit_id, "message": message, "parent": parent, "snapshot": snapshot})
    repo["files"] = snapshot
    repo["staged"] = {}
    print("[" + commit_id + "] " + message)


def log():
    print("--- git log ---")
    for c in reversed(repo["commits"]):
        print(c["id"] + "  " + c["message"] + "  (parent: " + c["parent"] + ")")


add("index.html", "<h1>Hello</h1>")
commit("Add home page")
add("style.css", "h1 { color: red }")
commit("Add styles")
commit("Empty commit?")
add("index.html", "<h1>Namaste</h1>")
commit("Change greeting")
log()

first = repo["commits"][0]
print("Time travel to " + first["id"] + ":", json.dumps(first["snapshot"]))
print("Latest files:", ", ".join(repo["files"].keys()))
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Git ki sabse common galtiyan:

- **\`git add\` bhool jaana**: edit kiya, seedha \`git commit\` → "nothing added to commit". Pehle add, phir commit.
- **Secrets commit kar dena**: \`.env\` file jisme database password ya API key hai, GitHub pe push ho gayi. Bots minutes mein aisi keys dhoondh lete hain. \`.env\` ko **\`.gitignore\`** mein daalo.
- **\`node_modules\` / \`venv\` commit karna**: hazaaron files, repo bhaari. Ye \`npm install\` / \`pip install\` se dobara bante hain — ignore karo.
- **Bekaar messages**: \`"update"\`, \`"asdf"\`, \`"final fix"\`. Likho kya kiya: \`"Fix crash when cart is empty"\`.
- **Ek commit mein 10 kaam**: chhote, focused commits banao — revert aur review dono easy.
- **Bina samjhe \`git push --force\` ya \`git reset --hard\`**: dusron ka ya apna unsaved kaam ud sakta hai.`,
          en: `The most common Git mistakes:

- **Forgetting \`git add\`**: you edit and run \`git commit\` → "nothing added to commit". Add first, then commit.
- **Committing secrets**: a \`.env\` file with a database password or API key gets pushed to GitHub. Bots find such keys within minutes. Put \`.env\` in **\`.gitignore\`**.
- **Committing \`node_modules\` / \`venv\`**: thousands of files and a heavy repo. They can be recreated with \`npm install\` / \`pip install\` — ignore them.
- **Useless messages**: \`"update"\`, \`"asdf"\`, \`"final fix"\`. Write what you did: \`"Fix crash when cart is empty"\`.
- **Ten changes in one commit**: make small, focused commits — easier to review and revert.
- **Running \`git push --force\` or \`git reset --hard\` without understanding**: you can lose work.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Git confuse kare toh sabse pehle: **\`git status\`**. Ye batata hai kaunsi files modified hain, kaunsi staged hain, aur tum kis branch pe ho. Aksar ye agla command bhi suggest karta hai!

Common situations:

1. **"fatal: not a git repository"** → tum galat folder mein ho, ya \`git init\` nahi kiya. \`pwd\` check karo.
2. **Kya badla dekhna hai?** \`git diff\` (unstaged changes), \`git diff --staged\` (jo commit hone wala hai).
3. **History dekhni hai?** \`git log --oneline\` — har commit ek line mein.
4. **Galat file add ho gayi?** \`git restore --staged file.txt\` — staging se hata do, file safe rahegi.
5. **Last commit ka message galat?** (push se pehle) \`git commit --amend -m "naya message"\`.
6. **Merge conflict?** File kholo, \`<<<<<<<\` aur \`>>>>>>>\` ke beech dono versions dikhenge. Sahi wala rakho, markers hatao, phir add + commit.

Darr lage toh pehle \`git stash\` ya ek backup branch bana lo.`,
          en: `When Git confuses you, start with **\`git status\`**. It shows which files are modified, which are staged and which branch you are on. It often suggests the next command too.

Common situations:

1. **"fatal: not a git repository"** → you are in the wrong folder, or never ran \`git init\`. Check \`pwd\`.
2. **What changed?** \`git diff\` (unstaged changes), \`git diff --staged\` (what will be committed).
3. **See history:** \`git log --oneline\` — one line per commit.
4. **Added the wrong file?** \`git restore --staged file.txt\` removes it from staging; the file stays safe.
5. **Wrong last commit message?** (before pushing) \`git commit --amend -m "new message"\`.
6. **Merge conflict?** Open the file; both versions appear between \`<<<<<<<\` and \`>>>>>>>\`. Keep the right code, remove the markers, then add and commit.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Git almost hamesha sahi choice hai, par kuch limits samjho:

- **Badi binary files** (videos, datasets, design files): Git har version ki poori copy rakhta hai, repo GBs mein chala jaata hai. Inke liye **Git LFS** ya cloud storage (S3, Google Drive) use karo.
- **Learning curve**: rebase, cherry-pick, detached HEAD — shuru mein darawne lagte hain. Basic workflow (add, commit, push, pull, branch) se shuru karo.
- **Secrets ka permanent record**: commit hua password baad mein delete karne se bhi history mein rehta hai. Key ko **rotate (badalna)** hi padega.
- **Alternatives**: SVN (purana, centralized), Mercurial — aaj kal rare. Google Docs jaisi auto-history code ke liye kaafi nahi, kyunki wahan branches, review aur merge nahi.

Commit kitna chhota? Rule: **ek commit = ek logical change** jo apne aap mein samajh aaye aur project ko working state mein chhode.`,
          en: `Git is almost always the right choice, but know its limits:

- **Large binary files** (videos, datasets, design files): Git keeps a full copy of every version, so the repo grows to gigabytes. Use **Git LFS** or cloud storage (S3, Google Drive).
- **Learning curve**: rebase, cherry-pick and detached HEAD feel scary at first. Start with the basic flow: add, commit, push, pull, branch.
- **Secrets stay forever**: a committed password stays in history even after you delete it. You must **rotate** (change) the key.
- **Alternatives**: SVN (older, centralized) and Mercurial are rare today. Auto-history like Google Docs is not enough for code — no branches, reviews or merges.

How small should a commit be? **One commit = one logical change** that makes sense alone and leaves the project working.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Internship ke pehle hafte ka typical din:

\`\`\`
git clone https://github.com/company/app.git
cd app
git checkout -b fix-cart-total
# ... code edit karo ...
git status
git add src/cart.js
git commit -m "Fix cart total when coupon is applied"
git push origin fix-cart-total
\`\`\`

Phir GitHub pe **pull request** kholte ho. Senior review karte hain, comments dete hain, tum naye commits push karte ho. Approve hone ke baad merge — aur CI/CD automatically deploy kar deta hai.

Production mein bug aaya? \`git log\` aur \`git blame\` se pata chalta hai kaunsa commit ye laaya, aur \`git revert <id>\` se us change ko safely undo kar dete hain — bina history mitaye.

Apne college projects mein bhi pehle din se Git use karo — wahi tumhara portfolio banega.`,
          en: `A typical day in the first week of an internship:

\`\`\`
git clone https://github.com/company/app.git
cd app
git checkout -b fix-cart-total
# ... edit code ...
git status
git add src/cart.js
git commit -m "Fix cart total when coupon is applied"
git push origin fix-cart-total
\`\`\`

Then you open a **pull request** on GitHub. Seniors review it and leave comments; you push new commits. After approval it is merged, and CI/CD deploys it automatically.

A bug in production? \`git log\` and \`git blame\` show which commit introduced it, and \`git revert <id>\` safely undoes that change without erasing history.`,
        },
      },
    ],
    visualization: {
      kind: "TIMELINE",
      title: "File edit se commit history tak",
      steps: [
        { title: "git init", description: "Folder mein ek chhupa hua .git folder banta hai. Ab Git is project ko track kar sakta hai.", highlight: ".git" },
        { title: "Edit files", description: "Tum index.html badalte ho. Change abhi sirf working directory mein hai — Git ne save nahi kiya.", highlight: "working directory" },
        { title: "git add", description: "Tum chunte ho ki index.html agle snapshot mein jaayega. Ye staging area mein aa gaya.", highlight: "staging area" },
        { title: "git commit", description: "Snapshot save hua, ek ID (jaise a1b2c3d) aur message ke saath. Ye pichle commit ko parent ki tarah point karta hai.", highlight: "commit a1b2c3d" },
        { title: "git log", description: "Saare commits naye se purane tak ek chain mein dikhte hain. Kisi bhi point pe wapas ja sakte ho.", highlight: "history" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `git add file.js` do?",
        options: [
          "Moves the changes in file.js to the staging area",
          "Uploads file.js to GitHub",
          "Creates a new repository",
          "Deletes file.js",
        ],
        correct: [0],
        explanation: "git add sirf staging area mein daalta hai — 'agle commit mein ye jaayega'. Upload git push karta hai.",
        tags: ["staging"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `git init` do?",
        options: [
          "Creates a new Git repository (a .git folder) in the current folder",
          "Downloads a project from GitHub",
          "Installs Git on your computer",
          "Saves a commit",
        ],
        correct: [0],
        explanation: "git init current folder mein .git banata hai. Download ke liye git clone, save ke liye git commit.",
        tags: ["setup"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "What is a commit in Git?",
        options: [
          "A saved snapshot of the project with a message, author and parent",
          "A copy of a file on GitHub",
          "A list of people working on the project",
          "An error when two people edit the same line",
        ],
        correct: [0],
        explanation: "Commit = snapshot + message + author + parent pointer. Do logon ka same line edit karna merge conflict hai.",
        tags: ["commit"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these should usually NOT be committed to a Git repository?",
        options: ["The node_modules folder", "A .env file with API keys", "Your source code files", "README.md"],
        correct: [0, 1],
        explanation: "node_modules dobara install ho sakta hai aur bahut bhaari hai; .env mein secrets hote hain. Dono .gitignore mein jaate hain. Source code aur README toh commit karne hi hain.",
        tags: ["gitignore"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "This Python code models staging and committing. What does it print?",
        code: `commits = []
staged = ["index.html"]
commits.append(list(staged))
staged.clear()
staged.append("style.css")
print(len(commits), staged)`,
        codeLanguage: "python",
        options: ["1 ['style.css']", "2 ['style.css']", "1 []", "0 ['style.css']"],
        correct: [0],
        explanation: "Ek hi commit hua (list(staged) ki copy gayi). Uske baad staging clear hua aur style.css add hua, jo abhi commit nahi hua. Output: 1 ['style.css'] — bilkul Git jaisa.",
        tags: ["model"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "You edited app.js and ran `git commit -m \"fix\"`, but Git says 'no changes added to commit'. What went wrong?",
        options: [
          "You did not run git add, so nothing was in the staging area",
          "Commit messages must be longer than 3 letters",
          "You need to push before committing",
          "Git only tracks .py files",
        ],
        correct: [0],
        explanation: "Commit sirf staged changes save karta hai. Pehle git add app.js, phir commit. git status chalate toh ye turant dikh jaata.",
        tags: ["staging", "debugging"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 1,
        prompt: "Put these steps in order to start tracking a new project with Git.",
        options: [
          "Run git init in the project folder",
          "Create or edit your files",
          "Run git add . to stage the changes",
          "Run git commit -m \"Initial commit\"",
          "Run git log to see the history",
        ],
        explanation: "Repo banao (init) → kaam karo → stage karo (add) → snapshot save karo (commit) → history dekho (log).",
        tags: ["workflow"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why does Git have a staging area instead of committing every change directly?",
        keywords: ["choose", "selected changes", "snapshot", "review", "small commits"],
        explanation: "Staging area se tum choose karte ho ki kaunse changes agle commit mein jaayein. Isse ek logical change = ek commit ban paata hai, aur commit se pehle review kar sakte ho.",
        tags: ["concepts"],
      },
    ],
    interview: [
      {
        question: "What is the difference between Git and GitHub?",
        short: "Git is a distributed version control tool that runs on your machine and tracks the history of your project. GitHub is a hosting service for Git repositories that adds collaboration features like pull requests, code review, issues and CI. You can use Git without GitHub, for example with GitLab or only locally.",
        deep: `- **Git**: open-source CLI tool by Linus Torvalds (2005). Every clone has the full history — that is what "distributed" means.
- **GitHub** (owned by Microsoft): remote hosting + collaboration: PRs, reviews, Issues, Actions (CI/CD), Pages.
- Alternatives to GitHub: GitLab, Bitbucket, self-hosted Gitea.
- \`git push\` / \`git pull\` sync your local repo with a remote such as GitHub.`,
        followUps: ["What does 'distributed' mean in distributed version control?", "What is a pull request?"],
        commonMistake: "Using the two words interchangeably, or thinking Git needs the internet to work.",
        keywords: ["version control", "hosting", "pull request", "distributed"],
        difficulty: 1,
        roles: ["SDE", "FULLSTACK", "FRONTEND", "BACKEND"],
      },
      {
        question: "Explain the working directory, staging area and repository in Git.",
        short: "The working directory is the files you edit. The staging area, or index, holds the changes you have chosen for the next commit using git add. The repository, inside the .git folder, stores the committed snapshots permanently. So the flow is edit, then add to stage, then commit to save.",
        deep: `- **Working directory** → \`git add\` → **staging area (index)** → \`git commit\` → **repository**.
- \`git status\` compares all three.
- \`git diff\` = working vs staging; \`git diff --staged\` = staging vs last commit.
- Staging lets you split messy work into clean, logical commits (\`git add -p\` stages parts of a file).
- Undo helpers: \`git restore file\` (discard working changes), \`git restore --staged file\` (unstage).`,
        followUps: ["How do you unstage a file?", "What does git add -p do?", "What is HEAD?"],
        commonMistake: "Thinking git commit saves all modified files automatically.",
        keywords: ["staging", "index", "commit", "snapshot"],
        difficulty: 2,
        roles: ["SDE", "FULLSTACK", "DEVOPS"],
      },
      {
        question: "How would you undo a commit that has already been pushed to a shared branch?",
        short: "I would use git revert with the commit ID. It creates a new commit that reverses the changes, so the history stays intact and teammates are not affected. I would avoid git reset and force-push on a shared branch, because that rewrites history others have already pulled.",
        deep: `- \`git revert <id>\` → new "undo" commit; safe for shared branches.
- \`git reset --hard <id>\` + \`git push --force\` → rewrites history; only for your own private branch.
- If secrets were pushed, reverting is not enough — **rotate the secret**, because it remains in history.
- For local, unpushed mistakes: \`git commit --amend\` or \`git reset --soft HEAD~1\`.`,
        followUps: ["What is the difference between reset --soft and reset --hard?", "Why is force-pushing dangerous?"],
        commonMistake: "Using git reset --hard and force-pushing on main, breaking teammates' clones.",
        keywords: ["revert", "new commit", "history", "force push"],
        difficulty: 3,
        roles: ["SDE", "DEVOPS", "BACKEND"],
      },
    ],
    promptCard: {
      title: "Fix a Git problem safely",
      category: "DEBUGGING",
      task: "Understand a Git error or messy situation and get step-by-step commands that do not lose work.",
      whenToUse: "When Git shows an error, a merge conflict, or you are afraid a command might delete your work.",
      template: `I am learning Git. I am stuck and I do not want to lose any work.

What I was trying to do:
[GOAL]

The commands I ran (in order):
[COMMANDS_RUN]

The output of git status:
[GIT_STATUS_OUTPUT]

The error or message I see:
[ERROR_MESSAGE]

Is this branch shared with teammates? [SHARED_BRANCH]

Please:
1. Explain in simple words what state my repository is in.
2. Give the safest commands to fix it, one at a time, explaining each.
3. Tell me how to back up my work first (for example a new branch or git stash).
4. Warn me clearly before any command that rewrites history or deletes changes.`,
      variables: [
        { key: "GOAL", label: "What you wanted to do (e.g. push my changes, undo last commit)" },
        { key: "COMMANDS_RUN", label: "The git commands you ran, in order" },
        { key: "GIT_STATUS_OUTPUT", label: "Full output of git status" },
        { key: "ERROR_MESSAGE", label: "The exact error or message from Git" },
        { key: "SHARED_BRANCH", label: "Yes/No — is anyone else using this branch?" },
      ],
      whyItWorks: [
        { part: "git status output", why: "It shows the real state of the repository (branch, staged and unstaged files), so the AI does not have to guess." },
        { part: "Commands run in order", why: "Most Git problems come from a sequence of steps; the history explains how you got here." },
        { part: "Shared branch question", why: "The safe fix differs: revert for shared branches, reset is only okay for private ones." },
        { part: "Backup first", why: "A backup branch or stash means you can try fixes without fear." },
      ],
      verifyChecklist: [
        "Create a backup branch or stash before running the suggested fix",
        "Run git status after every command and check it matches what the AI said would happen",
        "Avoid --force and reset --hard on shared branches unless your team agrees",
        "Confirm your changes are still present with git log and git diff after the fix",
      ],
      sampleOutput: `**Your state:** You committed on main, but your push was rejected because the remote main has new commits you do not have locally.

**Backup first:** \`git branch backup-my-work\`

**Fix:**
1. \`git pull --rebase origin main\` — replays your commit on top of the latest remote commits.
2. If there is a conflict, fix the file, then \`git add <file>\` and \`git rebase --continue\`.
3. \`git push origin main\`

No history on the remote is rewritten, so this is safe for a shared branch.`,
    },
  },
  // ───────────────────────────── internet-client-server ─────────────────────────────
  {
    slug: "internet-client-server",
    estMinutes: 20,
    difficulty: 1,
    prerequisites: ["binary-bits-bytes"],
    objectives: [
      "Explain what the internet is: a network of networks",
      "Describe the client–server model with real app examples",
      "Follow a request from your phone to a server and back",
      "Tell client-side problems from server-side problems",
    ],
    technicalDefinition:
      "The internet is a global network of interconnected networks that exchange data as packets using the TCP/IP protocol suite; in the client–server model, clients initiate requests and servers listen for, process and respond to those requests.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Internet** = duniya bhar ke computers aur networks ka ek bahut bada jaal, jo common rules (**protocols**, jaise TCP/IP) se aapas mein baat karte hain. Ye ek network nahi, **networks ka network** hai — tumhara ghar ka Wi-Fi, Jio ka network, Google ke data centers, sab jude hue.

Is internet pe zyada tar apps **client–server model** pe chalti hain:

- **Client**: jo **request bhejta hai** — tumhara browser, Zomato app, WhatsApp.
- **Server**: ek computer jo hamesha on rehta hai, requests ka **wait karta hai** aur **response bhejta hai** — jaise Zomato ka backend jo restaurants ki list deta hai.

Rule simple hai: **client poochta hai, server jawab deta hai.** Baat hamesha client shuru karta hai.`,
          en: `The **internet** is a huge web of computers and networks around the world that talk to each other using common rules called **protocols** (like TCP/IP). It is not one network but a **network of networks** — your home Wi-Fi, Jio's network and Google's data centers are all connected.

Most apps on the internet use the **client–server model**:

- **Client**: the one that **sends a request** — your browser, the Zomato app, WhatsApp.
- **Server**: a computer that is always on, **waits for requests** and **sends responses** — like Zomato's backend that returns the list of restaurants.

The rule is simple: **the client asks, the server answers.** The client always starts the conversation.`,
          hi: `**इंटरनेट** = दुनिया भर के कंप्यूटरों और नेटवर्कों का एक बहुत बड़ा जाल, जो साझा नियमों (**प्रोटोकॉल**) से आपस में बात करते हैं। यह एक नेटवर्क नहीं, **नेटवर्कों का नेटवर्क** है।

इंटरनेट पर ज़्यादातर ऐप **क्लाइंट–सर्वर मॉडल** पर चलते हैं:

- **क्लाइंट**: जो **अनुरोध (request) भेजता है** — तुम्हारा ब्राउज़र या कोई ऐप।
- **सर्वर**: एक कंप्यूटर जो हमेशा चालू रहता है, अनुरोध का इंतज़ार करता है और **जवाब (response) भेजता है**।

नियम सीधा है: **क्लाइंट पूछता है, सर्वर जवाब देता है।**`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Restaurant** socho:

- **Tum (customer) = client.** Tum order dete ho: "Ek masala dosa."
- **Waiter = internet / network.** Tumhara order kitchen tak le jaata hai aur khana wapas laata hai. Waiter khud khana nahi banata, sirf le jaata aur laata hai.
- **Kitchen = server.** Order aata hai, kitchen dosa banata hai aur bhejta hai. Kitchen kabhi khud tumhare table pe aake nahi kehta "dosa khaoge?" — wo **order ka wait karta hai**.
- **Menu = API.** Sirf wahi order kar sakte ho jo menu mein hai.

Ek kitchen ek saath **bahut saare tables** ko serve karta hai — waise hi ek Zomato server lakhs phones ko serve karta hai.

Aur agar khana nahi aaya, toh do possibility: ya toh waiter tak order pahuncha hi nahi (**network problem**), ya kitchen mein gas khatam (**server problem**).`,
          en: `Think of a **restaurant**:

- **You (the customer) = client.** You place an order: "One masala dosa."
- **Waiter = the internet / network.** Takes your order to the kitchen and brings food back. The waiter does not cook — only carries.
- **Kitchen = server.** It receives the order, makes the dosa and sends it out. The kitchen never comes to your table asking "want a dosa?" — it **waits for orders**.
- **Menu = API.** You can only order what is on the menu.

One kitchen serves **many tables** at once — just like one Zomato server serves lakhs of phones.

If food never arrives, either the order never reached the kitchen (**network problem**) or the kitchen ran out of gas (**server problem**).`,
          hi: `एक **रेस्टोरेंट** सोचो:

- **तुम (ग्राहक) = क्लाइंट।** तुम ऑर्डर देते हो: "एक मसाला डोसा।"
- **वेटर = इंटरनेट।** तुम्हारा ऑर्डर रसोई तक ले जाता है और खाना वापस लाता है।
- **रसोई = सर्वर।** ऑर्डर आता है, रसोई डोसा बनाकर भेजती है। रसोई ख़ुद तुम्हारी टेबल पर नहीं आती — वह **ऑर्डर का इंतज़ार करती है**।
- **मेन्यू = API।** सिर्फ़ वही मँगा सकते हो जो मेन्यू में है।

एक रसोई एक साथ बहुत सारी टेबलों को खाना देती है — वैसे ही एक सर्वर लाखों फ़ोनों को।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Sawal: data seedha tumhare phone mein kyun nahi rakh dete? Server ki zaroorat kyun?

- **Shared data**: Zomato pe 3 lakh restaurants ke menu, prices, ratings hain. Ye har phone mein store nahi ho sakte, aur roz badalte hain. Ek jagah (server) rakho, sab wahan se lein.
- **Ek hi sach (single source of truth)**: tumhara order restaurant ko, delivery partner ko, aur tumhe — teeno ko same dikhna chahiye. Ye tabhi possible hai jab data ek central server pe ho.
- **Security**: payment verify karna, password check karna — ye kaam user ke phone pe nahi chhod sakte, warna koi bhi app ko hack karke "payment successful" bol dega.
- **Updates**: server pe code badlo, sab users ko turant naya feature mil gaya.

Bina client–server ke na UPI chalta, na Instagram feed, na IRCTC booking.`,
          en: `Why not just keep all the data on your phone? Why do we need servers?

- **Shared data**: Zomato has menus, prices and ratings for lakhs of restaurants. They cannot fit on every phone, and they change daily. Keep them in one place (the server) and let everyone fetch them.
- **A single source of truth**: your order must look the same to you, the restaurant and the delivery partner. That only works when the data lives on a central server.
- **Security**: verifying payments and checking passwords cannot be left to the user's phone, or anyone could hack the app and claim "payment successful".
- **Updates**: change the code on the server and every user gets the new feature immediately.

Without client–server, there would be no UPI, Instagram feed or IRCTC booking.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Client–server har app mein hai:

- **Zomato / Swiggy**: app (client) location bhejta hai → server nearby restaurants ki list bhejta hai. Order place karte ho → server restaurant aur delivery partner ke apps ko bhi update karta hai.
- **PhonePe / Google Pay (UPI)**: tumhara app request bhejta hai → PhonePe ka server NPCI ke server ko → NPCI bank ke server ko. Yahan ek server doosre server ka **client** ban jaata hai!
- **YouTube / Hotstar**: video ek baar mein nahi aata; client chhote chhote tukde (chunks) maangta rehta hai aur server bhejta rehta hai — isliye bich mein quality badalti hai.

Dhyaan do: "client" aur "server" **role** hain, machine nahi. Tumhara laptop bhi server ban sakta hai jab tum \`npm run dev\` chalate ho aur browser se \`localhost:3000\` kholte ho.`,
          en: `Client–server is in every app:

- **Zomato / Swiggy**: the app (client) sends your location → the server returns nearby restaurants. When you order, the server also updates the restaurant's and the delivery partner's apps.
- **PhonePe / Google Pay (UPI)**: your app sends a request → PhonePe's server calls NPCI's server → NPCI calls the bank's server. Here a server becomes a **client** of another server!
- **YouTube / Hotstar**: a video does not arrive all at once; the client keeps asking for small chunks and the server keeps sending them — that is why quality can change mid-video.

Note: "client" and "server" are **roles**, not machines. Your laptop becomes a server when you run \`npm run dev\` and open \`localhost:3000\` in a browser.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Jab tumhara phone Zomato server se baat karta hai, andar kya hota hai?

1. **Message ko packets mein todna**: data chhote tukdon (packets) mein toota jaata hai. Har packet pe "kahan se" aur "kahan jaana hai" ka address (**IP address**) likha hota hai — jaise courier ka parcel.
2. **Local network**: packet tumhare Wi-Fi router ya mobile tower tak jaata hai.
3. **ISP**: Jio/Airtel ka network packet ko aage bhejta hai.
4. **Routers ka chain**: internet pe bahut saare routers hain. Har router dekhta hai "ye packet kahan jaana hai" aur agle best router ko de deta hai — jaise Indian Railways mein train junction pe track badalti hai. Kabhi kabhi packets **samudra ke neeche ki cables** se doosre desh jaate hain.
5. **Server**: packets pahunchte hain, **TCP** unhe sahi order mein jodta hai aur missing packets dobara mangwata hai.
6. Server response banata hai aur wahi safar ulta hota hai.

Ye sab aam taur pe **100 milliseconds se kam** mein!`,
          en: `What happens when your phone talks to the Zomato server?

1. **Split into packets**: data is broken into small pieces called packets. Each packet carries the "from" and "to" address (**IP address**) — like a courier parcel.
2. **Local network**: the packet goes to your Wi-Fi router or mobile tower.
3. **ISP**: Jio's or Airtel's network forwards it.
4. **Chain of routers**: the internet has many routers. Each one checks where the packet is going and passes it to the next best router — like trains switching tracks at a junction. Sometimes packets travel through **undersea cables** to other countries.
5. **Server**: the packets arrive, and **TCP** puts them back in order and asks again for any missing ones.
6. The server builds a response, and the same journey happens in reverse — usually in **under 100 milliseconds**.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yahan koi asli network nahi hai — hum ek hi program mein **client aur server ko functions** bana ke model kar rahe hain, taaki idea saaf dikhe.

1. \`menu\` server ka data hai — sirf server ke paas hai, client ke paas nahi.
2. \`server(request)\` ek request object leta hai, \`path\` dekhta hai aur ek response object (\`status\` + \`body\`) return karta hai. Unknown path ya item → \`404\`.
3. \`client(name, request)\` request "bhejta" hai, response "receive" karta hai aur dono print karta hai.
4. Teen alag clients (Ravi, Priya, Amit) **ek hi server** se baat karte hain — bilkul real life jaisa.
5. \`JSON.stringify\` / \`json.dumps\` object ko text banata hai, kyunki network pe sirf text/bytes jaate hain.`,
          en: `There is no real network here — we model the **client and server as functions** in one program so the idea is clear.

1. \`menu\` is the server's data — only the server has it, not the client.
2. \`server(request)\` takes a request object, checks the \`path\` and returns a response object (\`status\` + \`body\`). An unknown path or item → \`404\`.
3. \`client(name, request)\` "sends" a request, "receives" the response and prints both.
4. Three different clients (Ravi, Priya, Amit) talk to **the same server** — just like real life.
5. \`JSON.stringify\` / \`json.dumps\` turns objects into text, because only text/bytes travel over a network.`,
        },
        codeJs: `// Data that lives only on the server
const menu = { chai: 15, samosa: 20, "vada pav": 25 };

function server(request) {
  if (request.path === "/menu") {
    return { status: 200, body: Object.keys(menu) };
  }
  if (request.path === "/price") {
    const price = menu[request.item];
    if (price === undefined) return { status: 404, body: "item not found" };
    return { status: 200, body: price };
  }
  return { status: 404, body: "no such page" };
}

function client(name, request) {
  console.log(name + " -> server : " + JSON.stringify(request));
  const response = server(request); // in real life this travels over the internet
  console.log("server -> " + name + " : " + JSON.stringify(response));
}

client("Ravi's phone", { path: "/menu" });
client("Priya's laptop", { path: "/price", item: "samosa" });
client("Amit's app", { path: "/price", item: "pizza" });
client("Amit's app", { path: "/admin" });
`,
        codePython: `import json

# Data that lives only on the server
menu = {"chai": 15, "samosa": 20, "vada pav": 25}


def server(request):
    if request["path"] == "/menu":
        return {"status": 200, "body": list(menu.keys())}
    if request["path"] == "/price":
        price = menu.get(request.get("item"))
        if price is None:
            return {"status": 404, "body": "item not found"}
        return {"status": 200, "body": price}
    return {"status": 404, "body": "no such page"}


def client(name, request):
    print(name + " -> server : " + json.dumps(request))
    response = server(request)  # in real life this travels over the internet
    print("server -> " + name + " : " + json.dumps(response))


client("Ravi's phone", {"path": "/menu"})
client("Priya's laptop", {"path": "/price", "item": "samosa"})
client("Amit's app", {"path": "/price", "item": "pizza"})
client("Amit's app", {"path": "/admin"})
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Beginners aksar ye socho:

- **"Internet = Wi-Fi."** Wi-Fi sirf tumhare ghar ka chhota local network hai jo router se judta hai. Internet uske baahar ka poora global network hai.
- **"Internet = Google/browser."** Browser ek client hai; Google ek company ke servers. Internet wo raasta hai jis pe ye baat karte hain.
- **"Server koi special super-computer hai."** Server bas ek computer hai jo ek program chala raha hai jo requests sunta hai. Tumhara laptop bhi server ban sakta hai.
- **"Server khud client ko message bhej sakta hai."** Normal HTTP mein nahi — client hi poochta hai. Live updates ke liye WebSockets ya push notifications jaise alag tareeke hain.
- **Client pe trust karna**: price ya discount client se aaye toh blindly accept karna. Koi bhi request badal sakta hai — **validation hamesha server pe**.`,
          en: `Beginners often think:

- **"Internet = Wi-Fi."** Wi-Fi is just the small local network in your home, connected through a router. The internet is the global network beyond it.
- **"Internet = Google or the browser."** A browser is a client; Google is a company's servers. The internet is the road they talk over.
- **"A server is a special supercomputer."** A server is just a computer running a program that listens for requests. Your laptop can be one.
- **"A server can message the client whenever it wants."** Not in normal HTTP — the client asks. Live updates use WebSockets or push notifications.
- **Trusting the client**: accepting a price or discount sent by the client. Anyone can modify requests — **always validate on the server**.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `App kaam nahi kar rahi? Pehle pata karo **problem client side hai, network hai, ya server side**:

1. **Doosri websites khul rahi hain?** Nahi → tumhara internet/Wi-Fi problem. Haan → aage badho.
2. **Doosre device ya mobile data pe try karo.** Wahan chal gaya → tumhare network ya device ki problem (DNS, firewall, college Wi-Fi block).
3. **Status page / Downdetector dekho** — kabhi kabhi server hi down hota hai (jaise IRCTC Tatkal ke time).
4. **Browser DevTools → Network tab** kholo (F12). Har request ka status dikhega: request gayi hi nahi (network/CORS), \`4xx\` (client ne galat request bheji), \`5xx\` (server mein error).
5. **Developer ho toh server logs dekho** — wahan exact error milega.
6. Terminal mein \`ping google.com\` se check karo connection hai ya nahi.

Ye "kis side ki galti hai" sochna debugging ki sabse important habit hai.`,
          en: `App not working? First find out if the problem is on the **client, the network or the server**:

1. **Do other websites open?** No → your internet or Wi-Fi. Yes → continue.
2. **Try another device or mobile data.** If it works there → your network or device (DNS, firewall, college Wi-Fi blocking).
3. **Check a status page or Downdetector** — sometimes the server itself is down (like IRCTC at Tatkal time).
4. **Open browser DevTools → Network tab** (F12). Each request shows its status: never sent (network/CORS), \`4xx\` (client sent a bad request), \`5xx\` (server error).
5. **As the developer, check the server logs** for the exact error.
6. Run \`ping google.com\` in the terminal to test basic connectivity.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Client–server sabse common hai, par perfect nahi:

- **Single point of failure**: server down = sab users down. Isliye companies ek se zyada servers, load balancers aur backups rakhti hain.
- **Cost**: servers 24×7 chalte hain, paisa lagta hai. Zyada users = zyada servers.
- **Latency**: har kaam ke liye server tak jaana padta hai. Isliye apps kuch data phone pe **cache** karti hain (offline mode).

Alternatives:
- **Peer-to-peer (P2P)**: koi central server nahi, computers seedha aapas mein baat karte hain — BitTorrent, kuch video calls. Scale achha, par control aur security mushkil.
- **Edge / CDN**: content user ke paas wale servers pe copy karke rakhte hain (Cloudflare, Akamai) taaki fast mile.
- **Offline-first apps**: data pehle phone pe, baad mein sync (jaise Google Keep).

Zyada tar apps ke liye client–server hi sahi default hai.`,
          en: `Client–server is the most common model, but not perfect:

- **Single point of failure**: if the server is down, every user is down. So companies run many servers, load balancers and backups.
- **Cost**: servers run 24×7 and cost money. More users mean more servers.
- **Latency**: every action needs a trip to the server. So apps **cache** some data on the phone (offline mode).

Alternatives:
- **Peer-to-peer (P2P)**: no central server; computers talk directly — BitTorrent, some video calls. Scales well, but control and security are harder.
- **Edge / CDN**: copies content to servers near users (Cloudflare, Akamai) for speed.
- **Offline-first apps**: data lives on the device first and syncs later (like Google Keep).

For most apps, client–server is the right default.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Tum ek **college canteen pre-order app** bana rahe ho:

- **Client**: React website jo students ke phone pe chalti hai — menu dikhati hai, "Order" button.
- **Server**: Node.js/Express ya Django backend jo cloud (Render, Railway, AWS) pe chal raha hai.
- **Database**: server ke peeche PostgreSQL/MongoDB — client kabhi seedha database se baat nahi karta.

Flow: student "2 samosa" order karta hai → client \`POST /orders\` bhejta hai → server check karta hai stock hai ya nahi, price **server khud** database se nikalta hai (client wala price trust nahi karta) → order save → response "Order #142 confirmed".

Canteen wale bhaiya ka tablet bhi ek **client** hai jo har kuch second server se naye orders poochta hai.

Development mein dono tumhare laptop pe: frontend \`localhost:5173\`, backend \`localhost:3000\` — par roles wahi hain.`,
          en: `You are building a **college canteen pre-order app**:

- **Client**: a React website on students' phones — shows the menu and an "Order" button.
- **Server**: a Node.js/Express or Django backend running in the cloud (Render, Railway, AWS).
- **Database**: PostgreSQL/MongoDB behind the server — the client never talks to the database directly.

Flow: a student orders "2 samosa" → the client sends \`POST /orders\` → the server checks stock and reads the price **from the database itself** (never trusting the client's price) → saves the order → responds "Order #142 confirmed".

The canteen's tablet is also a **client** that asks the server for new orders every few seconds. During development both run on your laptop — frontend \`localhost:5173\`, backend \`localhost:3000\` — but the roles stay the same.`,
        },
      },
    ],
    visualization: {
      kind: "REQUEST_RESPONSE",
      title: "Zomato app se restaurant list tak",
      steps: [
        { title: "Client request banata hai", description: "Tumne Zomato app khola. App (client) request banata hai: 'mere location ke paas ke restaurants do'.", highlight: "client" },
        { title: "Packets network pe", description: "Request packets mein tootti hai aur Wi-Fi/Jio tower se ISP ke network mein jaati hai.", highlight: "network" },
        { title: "Routers aage badhate hain", description: "Internet ke routers har packet ko agle best raaste pe bhejte hain, jab tak wo Zomato ke data center tak na pahunche.", highlight: "routers" },
        { title: "Server process karta hai", description: "Zomato ka server request padhta hai, database se nearby restaurants nikalta hai aur response banata hai.", highlight: "server" },
        { title: "Response wapas", description: "Response usi tarah wapas aata hai aur app screen pe restaurants dikha deta hai — sab 1 second se kam mein.", highlight: "response" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "In the client–server model, who starts the conversation?",
        options: ["The client", "The server", "The router", "The database"],
        correct: [0],
        explanation: "Client request bhejta hai, server sirf jawab deta hai. Kitchen khud order nahi leta, customer order deta hai.",
        tags: ["client-server"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which of these is acting as a client?",
        options: [
          "The Chrome browser on your laptop opening a website",
          "The machine running Zomato's backend",
          "A database server storing orders",
          "A data center building",
        ],
        correct: [0],
        explanation: "Browser request bhejta hai, isliye client hai. Backend aur database server ka role nibhate hain.",
        tags: ["client-server"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Which description of the internet is most accurate?",
        options: [
          "A global network of networks that communicate using common protocols",
          "Google's servers",
          "The Wi-Fi in your home",
          "The web browser on your phone",
        ],
        correct: [0],
        explanation: "Internet networks ka network hai jo TCP/IP jaise common rules se baat karta hai. Wi-Fi sirf local network hai, browser sirf client.",
        tags: ["internet"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these can act as a server?",
        options: [
          "A computer running a web application",
          "Your laptop running `npm run dev`",
          "A virtual machine on AWS",
          "An HDMI cable",
        ],
        correct: [0, 1, 2],
        explanation: "Server ek role hai: jo program requests sun ke jawab de. Laptop, cloud VM, koi bhi computer server ban sakta hai. Cable sirf data le jaati hai.",
        tags: ["roles"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 1,
        prompt: "This function models a tiny server. What does the code print?",
        code: `function server(path) {
  if (path === "/home") return 200;
  return 404;
}
console.log(server("/home"), server("/about"));`,
        codeLanguage: "javascript",
        options: ["200 404", "200 200", "404 404", "404 200"],
        correct: [0],
        explanation: "/home ke liye server 200 deta hai. /about ka koi rule nahi hai, toh 404 (not found). Output: 200 404.",
        tags: ["code"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "The Zomato app shows 'Something went wrong', but YouTube and WhatsApp work fine on the same phone. What is the most likely cause?",
        options: [
          "A problem on Zomato's server side; your phone and internet are fine",
          "Your phone has no internet connection",
          "Your phone's RAM is full",
          "The internet has stopped working worldwide",
        ],
        correct: [0],
        explanation: "Doosri apps chal rahi hain, matlab tumhara internet theek hai. Problem specifically Zomato ke server (ya uske kisi service) mein hai.",
        tags: ["debugging"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Put the steps in order for what happens when you open a web page.",
        options: [
          "You enter a URL in the browser (the client)",
          "The request travels in packets over the internet to the server",
          "The server processes the request and prepares a response",
          "The response travels back and the browser shows the page",
        ],
        explanation: "Client request banata hai → network le jaata hai → server process karta hai → response wapas aata hai aur dikhta hai.",
        tags: ["flow"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why do apps like Zomato keep data on central servers instead of only on each user's phone?",
        keywords: ["shared data", "single source of truth", "security", "many clients", "updates"],
        explanation: "Central server pe data shared rehta hai, sabko same (single source of truth) dikhta hai, security checks wahan safe hote hain, aur ek update se sab clients ko naya data milta hai.",
        tags: ["concepts"],
      },
    ],
    interview: [
      {
        question: "Explain the client–server model.",
        short: "In the client–server model, a client such as a browser or mobile app sends a request, and a server that is listening on the network processes it and sends back a response. The server usually holds shared data and business logic, while the client handles the user interface. One server serves many clients at the same time.",
        deep: `- **Client**: initiates requests, renders the UI, should be treated as untrusted.
- **Server**: listens on a known address and port, validates input, runs business logic, talks to databases.
- **Roles, not machines**: a backend is a server to the app but a client to the payment gateway or database.
- **Stateless HTTP**: each request carries what the server needs (e.g. a token).
- **Scaling**: add more servers behind a load balancer.`,
        followUps: ["How is peer-to-peer different?", "Why should validation happen on the server?", "What is a load balancer?"],
        commonMistake: "Treating client and server as fixed machines instead of roles.",
        keywords: ["request", "response", "listens", "many clients"],
        difficulty: 1,
        roles: ["SDE", "BACKEND", "FULLSTACK", "FRONTEND"],
      },
      {
        question: "What is the difference between the internet and the World Wide Web?",
        short: "The internet is the global network infrastructure that connects computers using TCP/IP. The World Wide Web is one service that runs on top of the internet, made of web pages and resources linked by URLs and transferred using HTTP. Email, video calls and online games also use the internet but are not the web.",
        deep: `- **Internet** (1970s–80s): physical cables, routers, ISPs and protocols like IP and TCP.
- **Web** (1989, Tim Berners-Lee): HTML documents, URLs and HTTP, viewed in browsers.
- Other internet services: email (SMTP/IMAP), SSH, DNS, video calls (WebRTC/UDP), online games.
- Analogy: the internet is the road network; the web is one kind of vehicle on it.`,
        followUps: ["Which protocols does email use?", "What layer does HTTP work at?"],
        commonMistake: "Using 'internet' and 'web' as the same thing.",
        keywords: ["tcp/ip", "http", "infrastructure", "service"],
        difficulty: 2,
        roles: ["SDE", "FRONTEND", "BACKEND"],
      },
    ],
  },
  // ───────────────────────────── ip-ports-dns ─────────────────────────────
  {
    slug: "ip-ports-dns",
    estMinutes: 25,
    difficulty: 2,
    prerequisites: ["internet-client-server"],
    objectives: [
      "Explain what an IP address is and read an IPv4 address",
      "Understand why ports exist and know common port numbers",
      "Follow how DNS turns a domain name into an IP address",
      "Debug common errors like 'port already in use' and DNS failures",
    ],
    technicalDefinition:
      "An IP address identifies a network interface on an IP network, a port is a 16-bit number that identifies a specific process or service on that host, and DNS (Domain Name System) is a hierarchical, distributed system that resolves human-readable domain names into IP addresses.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `Internet pe kisi computer se baat karne ke liye teen cheezein chahiye:

- **IP address**: computer ka **address**, jaise \`142.250.183.14\`. IPv4 mein 4 numbers hote hain, har ek 0–255 (yani har number ek byte). Naya version **IPv6** lamba hota hai: \`2404:6800:4009::200e\`.
- **Port**: us computer ke andar **kaunsa program** — ek number 0 se 65535 tak. Jaise web server port **80** (HTTP) ya **443** (HTTPS) pe sunta hai, database **5432** pe.
- **DNS (Domain Name System)**: internet ki **phonebook**. Tum \`google.com\` likhte ho, DNS batata hai uska IP kya hai.

Poora address kuch aisa dikhta hai: \`142.250.183.14:443\` — **IP batata hai kaunsi building, port batata hai kaunsa flat.**`,
          en: `To talk to a computer on the internet, you need three things:

- **IP address**: the computer's **address**, like \`142.250.183.14\`. IPv4 has 4 numbers, each 0–255 (each number is one byte). The newer **IPv6** is longer: \`2404:6800:4009::200e\`.
- **Port**: **which program** on that computer — a number from 0 to 65535. A web server listens on port **80** (HTTP) or **443** (HTTPS), a PostgreSQL database on **5432**.
- **DNS (Domain Name System)**: the internet's **phonebook**. You type \`google.com\`, and DNS tells you its IP address.

A full address looks like \`142.250.183.14:443\` — **the IP picks the building, the port picks the flat.**`,
          hi: `इंटरनेट पर किसी कंप्यूटर से बात करने के लिए तीन चीज़ें चाहिए:

- **IP पता**: कंप्यूटर का **पता**, जैसे \`142.250.183.14\`। IPv4 में 4 संख्याएँ होती हैं, हर एक 0 से 255 तक।
- **पोर्ट**: उस कंप्यूटर के अंदर **कौन सा प्रोग्राम** — 0 से 65535 तक की एक संख्या। जैसे वेब सर्वर 443 पर सुनता है।
- **DNS**: इंटरनेट की **फ़ोनबुक**। तुम \`google.com\` लिखते हो, DNS बताता है उसका IP क्या है।

पूरा पता ऐसा दिखता है: \`142.250.183.14:443\` — **IP बताता है कौन सी इमारत, पोर्ट बताता है कौन सा फ़्लैट।**`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Ek **badi housing society** socho — "Shanti Apartments".

- **IP address = society ka address.** "Plot 42, Sector 15, Noida." Courier isi se building tak pahunchta hai.
- **Port = flat number.** Building mein 100 flats hain. Parcel "Flat 443" ke liye hai toh wahi jaayega, "Flat 22" mein nahi. Ek computer pe bhi bahut saare programs chalte hain — web server, database, SSH — har ek apne flat (port) mein.
- **DNS = society ka naam se address dhoondhna.** Tumhe sirf naam yaad hai "Shanti Apartments". Tum Google Maps ya kisi se poochte ho, wo exact address bata deta hai. Waise hi tum \`zomato.com\` yaad rakhte ho, DNS uska IP dhoondh deta hai.

Aur jaise ek flat mein ek hi family reh sakti hai, waise hi **ek port pe ek hi program** sun sakta hai. Doosra aaye toh "flat already occupied" — yani \`EADDRINUSE\` error!`,
          en: `Think of a **big housing society** — "Shanti Apartments".

- **IP address = the society's address.** "Plot 42, Sector 15, Noida." The courier uses it to reach the building.
- **Port = the flat number.** The building has 100 flats. A parcel for "Flat 443" goes there, not to "Flat 22". One computer runs many programs — web server, database, SSH — each in its own flat (port).
- **DNS = finding the address from the name.** You only remember "Shanti Apartments", so you ask Google Maps, which gives the exact address. Similarly you remember \`zomato.com\`, and DNS finds its IP.

Just as one flat holds one family, **one port can have only one listening program**. If another tries, the flat is "already occupied" — the \`EADDRINUSE\` error!`,
          hi: `एक **बड़ी हाउसिंग सोसाइटी** सोचो — "शांति अपार्टमेंट्स"।

- **IP पता = सोसाइटी का पता।** कूरियर इसी से इमारत तक पहुँचता है।
- **पोर्ट = फ़्लैट नंबर।** इमारत में कई फ़्लैट हैं; पार्सल "फ़्लैट 443" के लिए है तो वहीं जाएगा। एक कंप्यूटर पर भी कई प्रोग्राम चलते हैं, हर एक अपने पोर्ट में।
- **DNS = नाम से पता ढूँढना।** तुम्हें सिर्फ़ नाम याद है, कोई तुम्हें पूरा पता बता देता है।

और जैसे एक फ़्लैट में एक ही परिवार रह सकता है, वैसे ही **एक पोर्ट पर एक ही प्रोग्राम** सुन सकता है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `**IP kyun?** Internet pe arbon devices hain. Packet ko sahi machine tak pahunchane ke liye har device ka ek unique-sa address chahiye — bina address ke courier kahan jaayega?

**Port kyun?** Ek server pe ek saath kai programs chalte hain: website (443), SSH (22), database (5432). Packet machine tak toh pahunch gaya, par andar kis program ko dena hai? Port number ye decide karta hai. Tumhare laptop pe bhi Chrome, Spotify, WhatsApp sab alag ports use karte hain.

**DNS kyun?** Insaan numbers yaad nahi rakh sakte. \`142.250.183.14\` vs \`google.com\` — kaunsa easy hai? Aur IPs badalte rehte hain: company naye server pe shift kare toh sirf DNS record update karo, users ko kuch pata bhi nahi chalega.

Bina inko samjhe tum "localhost:3000", "connection refused" ya "DNS_PROBE_FINISHED_NXDOMAIN" jaise errors kabhi debug nahi kar paoge.`,
          en: `**Why IP addresses?** There are billions of devices online. To deliver a packet to the right machine, each device needs an address — without one, where would the courier go?

**Why ports?** One server runs many programs at once: a website (443), SSH (22), a database (5432). The packet reached the machine, but which program gets it? The port number decides. Even on your laptop, Chrome, Spotify and WhatsApp use different ports.

**Why DNS?** Humans cannot remember numbers. \`142.250.183.14\` or \`google.com\` — which is easier? IPs also change: if a company moves to a new server, it just updates the DNS record and users notice nothing.

Without this, you cannot debug errors like "localhost:3000", "connection refused" or "DNS_PROBE_FINISHED_NXDOMAIN".`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Ye concepts har jagah dikhte hain:

- **Cloudflare (1.1.1.1) aur Google (8.8.8.8)**: public DNS resolvers chalate hain. Bahut log apne phone/router mein ye DNS set karte hain kyunki ISP ke DNS se fast ya zyada reliable hote hain.
- **GoDaddy / Hostinger / Namecheap**: yahan se tum domain kharidte ho (jaise \`myportfolio.in\`) aur DNS records set karte ho — "A record" domain ko server ke IP pe point karta hai. Vercel pe custom domain lagate waqt bhi yahi karte ho.
- **AWS**: EC2 server lene par use ek public IP milta hai, aur **Security Group** mein tum decide karte ho kaunse ports khule hain — jaise 443 sabke liye, 22 (SSH) sirf tumhare IP ke liye. Database port (5432) internet pe kabhi khula nahi chhodte.

Tumhara ghar ka router bhi har device ko ek **private IP** deta hai jaise \`192.168.1.5\`.`,
          en: `You see these concepts everywhere:

- **Cloudflare (1.1.1.1) and Google (8.8.8.8)** run public DNS resolvers. Many people set these on their phone or router because they can be faster or more reliable than the ISP's DNS.
- **GoDaddy / Hostinger / Namecheap**: you buy a domain here (like \`myportfolio.in\`) and set DNS records — an "A record" points the domain to your server's IP. You do the same when adding a custom domain on Vercel.
- **AWS**: an EC2 server gets a public IP, and in its **Security Group** you choose which ports are open — 443 for everyone, 22 (SSH) only for your IP. You never open the database port (5432) to the whole internet.

Your home router also gives each device a **private IP** like \`192.168.1.5\`.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Tum browser mein \`zomato.com\` likhte ho. DNS lookup aise chalta hai:

1. **Browser cache**: "pehle kabhi dekha hai?" Haan → IP mil gaya, kaam khatam.
2. **OS cache + hosts file**: OS bhi apna cache aur \`/etc/hosts\` file check karta hai.
3. **Resolver**: nahi mila toh OS tumhare configured DNS resolver (ISP ka, ya 8.8.8.8) se poochta hai.
4. **Root server**: resolver root server se poochta hai — "\`.com\` waale kaun sambhalte hain?" Root batata hai **TLD server** ka address.
5. **TLD server (.com)**: batata hai "zomato.com ka **authoritative name server** ye hai".
6. **Authoritative server**: final jawab deta hai — "zomato.com = ye IP".
7. Resolver jawab ko **TTL** (time to live, jaise 300 seconds) tak cache karta hai, taaki agli baar seedha jawab de.

Phir browser us **IP** pe **port 443** pe connection kholta hai. Ye poora lookup aam taur pe kuch milliseconds ka hota hai — cache ki wajah se.`,
          en: `You type \`zomato.com\` in the browser. The DNS lookup goes like this:

1. **Browser cache**: "Seen it before?" Yes → we have the IP, done.
2. **OS cache + hosts file**: the OS checks its own cache and the \`/etc/hosts\` file.
3. **Resolver**: if not found, the OS asks the configured DNS resolver (your ISP's, or 8.8.8.8).
4. **Root server**: the resolver asks a root server, "who handles \`.com\`?" The root returns the **TLD server** address.
5. **TLD server (.com)**: replies "the **authoritative name server** for zomato.com is this one".
6. **Authoritative server**: gives the final answer — "zomato.com = this IP".
7. The resolver **caches** the answer for its **TTL** (time to live, e.g. 300 seconds) to answer faster next time.

Then the browser connects to that **IP** on **port 443**. Thanks to caching, the lookup usually takes only milliseconds.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Ye program ek **DNS resolver simulate** karta hai — root, TLD aur authoritative servers ko simple objects/dicts bana ke. (IPs example wale hain, asli nahi.)

1. \`rootServer\` TLD (\`com\`, \`in\`) se batata hai kis TLD server se poochna hai.
2. \`tldServers\` domain se batate hain kaunsa authoritative name server.
3. \`authoritative\` mein final domain → IP mapping hai.
4. \`resolve\` pehle \`cache\` check karta hai. Cache hit → turant jawab. Warna root → TLD → authoritative, har step print karte hue, aur end mein cache mein save.
5. \`google.com\` do baar resolve karte hain — doosri baar "cache hit" dikhega.
6. Last line batati hai browser ab \`IP:443\` pe connect karega.`,
          en: `This program **simulates a DNS resolver** — the root, TLD and authoritative servers are simple objects/dicts. (The IPs are examples, not real.)

1. \`rootServer\` maps a TLD (\`com\`, \`in\`) to the TLD server to ask.
2. \`tldServers\` map a domain to its authoritative name server.
3. \`authoritative\` holds the final domain → IP mapping.
4. \`resolve\` checks the \`cache\` first. A cache hit answers immediately. Otherwise it goes root → TLD → authoritative, printing each step, and saves the answer in the cache.
5. We resolve \`google.com\` twice — the second time shows "cache hit".
6. The last line shows the browser will now connect to \`IP:443\`.`,
        },
        codeJs: `// Example IPs from documentation ranges, not real ones
const rootServer = { com: "tld-com", in: "tld-in" };
const tldServers = {
  "tld-com": { "google.com": "ns1.google" },
  "tld-in": { "irctc.co.in": "ns1.irctc" },
};
const authoritative = {
  "ns1.google": { "google.com": "203.0.113.10" },
  "ns1.irctc": { "irctc.co.in": "198.51.100.7" },
};
const cache = {};

function resolve(domain) {
  if (cache[domain]) {
    console.log("cache hit: " + domain + " -> " + cache[domain]);
    return cache[domain];
  }
  const tld = domain.split(".").pop();
  const tldServer = rootServer[tld];
  console.log("root server: ask " + tldServer);
  const nameServer = tldServers[tldServer][domain];
  console.log(tldServer + ": ask " + nameServer);
  const ip = authoritative[nameServer][domain];
  console.log(nameServer + ": " + domain + " = " + ip);
  cache[domain] = ip;
  return ip;
}

const ip = resolve("google.com");
resolve("google.com");
resolve("irctc.co.in");
console.log("Browser connects to " + ip + ":443 (HTTPS)");
`,
        codePython: `# Example IPs from documentation ranges, not real ones
root_server = {"com": "tld-com", "in": "tld-in"}
tld_servers = {
    "tld-com": {"google.com": "ns1.google"},
    "tld-in": {"irctc.co.in": "ns1.irctc"},
}
authoritative = {
    "ns1.google": {"google.com": "203.0.113.10"},
    "ns1.irctc": {"irctc.co.in": "198.51.100.7"},
}
cache = {}


def resolve(domain):
    if domain in cache:
        print("cache hit: " + domain + " -> " + cache[domain])
        return cache[domain]
    tld = domain.split(".")[-1]
    tld_server = root_server[tld]
    print("root server: ask " + tld_server)
    name_server = tld_servers[tld_server][domain]
    print(tld_server + ": ask " + name_server)
    ip = authoritative[name_server][domain]
    print(name_server + ": " + domain + " = " + ip)
    cache[domain] = ip
    return ip


ip = resolve("google.com")
resolve("google.com")
resolve("irctc.co.in")
print("Browser connects to " + ip + ":443 (HTTPS)")
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Common galtiyan:

- **\`localhost\` ko public samajhna**: \`localhost\` / \`127.0.0.1\` ka matlab hai "yahi machine". Tumhara dost apne phone pe \`localhost:3000\` kholega toh **uska** phone check hoga, tumhara laptop nahi.
- **Server ko \`127.0.0.1\` pe bind karna aur bahar se access expect karna**: Docker ya cloud mein \`0.0.0.0\` pe sunna padta hai.
- **Private IP ko internet pe dhoondhna**: \`192.168.x.x\` aur \`10.x.x.x\` sirf local network ke andar kaam karte hain.
- **DNS change ke baad turant result expect karna**: purane records TTL tak cache mein rehte hain — minutes se ghante lag sakte hain.
- **URL mein port bhool jaana**: backend 5000 pe hai aur tum \`http://localhost\` (port 80) khol rahe ho.
- **Database port ko poore internet ke liye khol dena** — hackers sabse pehle yahi scan karte hain.`,
          en: `Common mistakes:

- **Thinking \`localhost\` is public**: \`localhost\` / \`127.0.0.1\` means "this same machine". If a friend opens \`localhost:3000\` on their phone, it checks **their** phone, not your laptop.
- **Binding a server to \`127.0.0.1\` and expecting outside access**: in Docker or the cloud, listen on \`0.0.0.0\`.
- **Looking for a private IP on the internet**: \`192.168.x.x\` and \`10.x.x.x\` only work inside a local network.
- **Expecting DNS changes instantly**: old records stay cached until the TTL ends — minutes to hours.
- **Forgetting the port in the URL**: the backend is on 5000 but you open \`http://localhost\` (port 80).
- **Opening the database port to the whole internet** — attackers scan for this first.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Network errors ko pehchaano:

1. **\`EADDRINUSE: address already in use :::3000\`** → port pe koi aur program pehle se baitha hai (shayad purana server jo band nahi hua). Mac/Linux: \`lsof -i :3000\` se dekho, phir use band karo — ya doosra port use karo.
2. **\`ECONNREFUSED\` / "connection refused"** → IP sahi hai par us port pe koi sun nahi raha. Server chal raha hai? Port sahi hai?
3. **\`DNS_PROBE_FINISHED_NXDOMAIN\` / \`ENOTFOUND\`** → domain ka IP nahi mila. Spelling check karo, phir \`nslookup example.com\` ya \`dig example.com\` chalao.
4. **Timeout** → packet ja raha hai par jawab nahi aa raha — firewall ya cloud security group port block kar raha hoga.
5. **Domain naye server pe point kiya par purana dikh raha hai** → DNS cache. Thoda wait karo ya \`dig\` se check karo kya IP aa raha hai.

\`ping\` se check karo machine reachable hai ya nahi (kuch servers ping block karte hain, dhyaan rahe).`,
          en: `Recognise network errors:

1. **\`EADDRINUSE: address already in use :::3000\`** → another program already uses that port (maybe an old server you did not stop). On Mac/Linux, \`lsof -i :3000\` shows it; stop it or use a different port.
2. **\`ECONNREFUSED\` / "connection refused"** → the IP is right but nothing is listening on that port. Is the server running? Is the port correct?
3. **\`DNS_PROBE_FINISHED_NXDOMAIN\` / \`ENOTFOUND\`** → no IP found for the domain. Check spelling, then run \`nslookup example.com\` or \`dig example.com\`.
4. **Timeout** → packets go out but no reply comes back — a firewall or cloud security group is probably blocking the port.
5. **Domain moved but the old site shows** → DNS cache. Wait, or check the IP with \`dig\`.

Use \`ping\` to test reachability (some servers block ping).`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Kuch design choices aur unke trade-offs:

- **IPv4 vs IPv6**: IPv4 mein sirf ~4.3 billion addresses — khatam ho chuke hain. Isliye ghar ke saare devices ek public IP share karte hain (**NAT**). IPv6 mein practically unlimited addresses hain, par abhi bhi har jagah poori tarah adopt nahi hua. Jio jaise networks IPv6 heavily use karte hain.
- **DNS TTL chhota vs bada**: chhota TTL (60s) = changes jaldi failte hain par DNS servers pe zyada load. Bada TTL (1 din) = fast aur sasta, par migration ke time purana IP der tak dikhega.
- **Default ports vs custom ports**: 443 use karo toh URL mein port likhna nahi padta. SSH ko 22 se hata ke custom port pe rakhna bots ka noise kam karta hai, par asli security nahi — keys aur firewall zaroori hain.
- **Domain vs seedha IP**: IP hardcode karna fast lagta hai, par server badla toh sab toot jaayega. Hamesha domain use karo.`,
          en: `Some design choices and their trade-offs:

- **IPv4 vs IPv6**: IPv4 has only ~4.3 billion addresses, and they have run out. So all devices in a home share one public IP using **NAT**. IPv6 has practically unlimited addresses but is not yet adopted everywhere. Networks like Jio use IPv6 heavily.
- **Short vs long DNS TTL**: a short TTL (60s) spreads changes quickly but loads DNS servers more. A long TTL (1 day) is fast and cheap, but during a migration the old IP lingers.
- **Default vs custom ports**: with 443 you do not write the port in the URL. Moving SSH off 22 reduces bot noise but is not real security — use keys and a firewall.
- **Domain vs raw IP**: hardcoding an IP feels quick, but everything breaks when the server changes. Always use a domain.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Tumne apna **portfolio + backend** deploy kiya:

- Laptop pe: frontend \`localhost:5173\`, backend \`localhost:5000\`. Frontend backend ko \`http://localhost:5000/api\` pe call karta hai.
- Deploy: backend ek AWS/DigitalOcean server pe, public IP \`203.0.113.25\`. Server pe app port 5000 pe chalta hai, aur **Nginx** port 443 pe sunke requests andar 5000 pe forward karta hai. Security group mein sirf 443 aur 22 khule.
- Domain: Hostinger se \`ravi.dev\` kharida. DNS mein **A record**: \`api.ravi.dev → 203.0.113.25\`. Frontend Vercel pe, uske liye **CNAME** record.
- Bug: deploy ke baad frontend abhi bhi \`localhost:5000\` call kar raha tha — users ke browser mein toh localhost unka apna computer hai! Fix: API URL ko environment variable mein rakha.

Contact form mein IP validate karna ho (jaise admin allow-list), toh is topic ka build task \`isValidIPv4\` kaam aayega.`,
          en: `You deploy your **portfolio + backend**:

- On your laptop: frontend \`localhost:5173\`, backend \`localhost:5000\`. The frontend calls \`http://localhost:5000/api\`.
- Deploy: the backend runs on an AWS/DigitalOcean server with public IP \`203.0.113.25\`. The app listens on port 5000, and **Nginx** listens on 443 and forwards requests to 5000. The security group opens only 443 and 22.
- Domain: you buy \`ravi.dev\` and add an **A record**: \`api.ravi.dev → 203.0.113.25\`. The frontend on Vercel gets a **CNAME** record.
- Bug: after deploy, the frontend still called \`localhost:5000\` — but in a user's browser, localhost is their own computer! Fix: put the API URL in an environment variable.

If you need to validate IPs (like an admin allow-list), this topic's build task \`isValidIPv4\` helps.`,
        },
      },
    ],
    visualization: {
      kind: "NETWORK",
      title: "zomato.com ka IP kaise milta hai",
      steps: [
        { title: "Browser + OS cache", description: "Browser aur OS pehle apna cache dekhte hain. Mila toh seedha step 5. Nahi mila toh resolver se poocho.", highlight: "cache" },
        { title: "Resolver → Root server", description: "DNS resolver (ISP ya 8.8.8.8) root server se poochta hai: '.com kaun sambhalta hai?'", highlight: "root" },
        { title: "TLD server (.com)", description: ".com TLD server batata hai ki zomato.com ka authoritative name server kaunsa hai.", highlight: ".com" },
        { title: "Authoritative server", description: "Zomato ka name server final jawab deta hai: zomato.com = ek IP address. Resolver ise TTL tak cache karta hai.", highlight: "A record" },
        { title: "Connect IP:443", description: "Browser us IP pe port 443 (HTTPS) pe connection kholta hai — ab asli request jaa sakti hai.", highlight: "IP:443" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the main job of DNS?",
        options: [
          "Convert domain names into IP addresses",
          "Encrypt data between browser and server",
          "Assign port numbers to programs",
          "Store website files",
        ],
        correct: [0],
        explanation: "DNS internet ki phonebook hai: google.com jaise naam ko IP address mein badalta hai. Encryption HTTPS/TLS ka kaam hai.",
        tags: ["dns"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which port is used by default for HTTPS?",
        options: ["80", "443", "22", "3306"],
        correct: [1],
        explanation: "HTTPS = 443, HTTP = 80, SSH = 22, MySQL = 3306. 443 aur 80 default hain, isliye URL mein likhne nahi padte.",
        tags: ["ports"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Which of these is a valid IPv4 address?",
        options: ["192.168.1.300", "10.0.0.1", "1.2.3", "a.b.c.d"],
        correct: [1],
        explanation: "IPv4 mein exactly 4 numbers, har ek 0–255. 300 bada hai, 1.2.3 mein 3 hi hain, aur letters allowed nahi. 10.0.0.1 sahi hai (private IP).",
        tags: ["ip"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which service → default port pairs are correct?",
        options: ["HTTP → 80", "SSH → 22", "PostgreSQL → 5432", "HTTPS → 21"],
        correct: [0, 1, 2],
        explanation: "HTTP 80, SSH 22, PostgreSQL 5432 sahi hain. Port 21 FTP ka hai; HTTPS 443 pe chalta hai.",
        tags: ["ports"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this Python code print?",
        code: `address = "142.250.183.14:443"
host, port = address.split(":")
print(host.count("."), int(port) + 1)`,
        codeLanguage: "python",
        options: ["3 444", "4 444", "3 443:1", "3 4431"],
        correct: [0],
        explanation: "IPv4 mein 4 numbers ke beech 3 dots hote hain. port string '443' ko int() se number banaya, +1 = 444. Output: 3 444.",
        tags: ["code"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "Your Express app is running on port 3000. You start a second copy and get 'EADDRINUSE: address already in use :::3000'. Why?",
        options: [
          "Only one program can listen on a given port on the same IP at a time",
          "Port 3000 is reserved for databases",
          "Your DNS is not configured",
          "Express can only run once per day",
        ],
        correct: [0],
        explanation: "Ek flat mein ek hi family! Pehla server 3000 pe already sun raha hai. Use band karo ya doosre ko 3001 jaise port pe chalao.",
        tags: ["ports", "debugging"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 3,
        prompt: "Put the DNS lookup steps in order for a domain that is not cached anywhere yet.",
        options: [
          "The browser and OS check their own DNS cache",
          "The OS asks the configured DNS resolver (e.g. the ISP or 8.8.8.8)",
          "The resolver asks a root server, then the .com TLD server",
          "The authoritative name server returns the IP address",
          "The browser connects to that IP on port 443",
        ],
        explanation: "Pehle local cache, phir resolver, resolver root → TLD → authoritative tak jaata hai, IP milta hai, aur tab browser connect karta hai.",
        tags: ["dns"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why do we need port numbers if we already have IP addresses?",
        keywords: ["multiple programs", "same machine", "process", "identify", "service"],
        explanation: "IP sirf machine tak pahunchata hai. Ek machine pe kai programs (services) chalte hain — web server, database, SSH. Port number batata hai packet kis process ko dena hai.",
        tags: ["concepts"],
      },
    ],
    buildTask: {
      title: "IPv4 address validator",
      description: `Function **\`isValidIPv4(ip)\`** likho jo \`true\` / \`false\` (Python mein \`True\` / \`False\`) return kare.

Valid IPv4 ke rules:
- Exactly **4 parts**, dots (\`.\`) se alag
- Har part mein **sirf digits** (1 se 3 digits), koi khaali part nahi
- Har number **0 se 255** ke beech
- **Leading zero nahi**: \`"01"\` invalid hai, par akela \`"0"\` valid hai

Examples: \`"192.168.1.1"\` → true, \`"256.1.1.1"\` → false, \`"1.2.3"\` → false`,
      functionName: "isValidIPv4",
      starterJs: `function isValidIPv4(ip) {
  // TODO: split on "." and check every part
}
`,
      starterPython: `def isValidIPv4(ip):
    # TODO: split on "." and check every part
    pass
`,
      tests: [
        { name: "home router IP", args: ["192.168.1.1"], expected: true },
        { name: "max values", args: ["255.255.255.255"], expected: true },
        { name: "all zeros", args: ["0.0.0.0"], expected: true },
        { name: "number above 255", args: ["256.1.1.1"], expected: false },
        { name: "only three parts", args: ["192.168.1"], expected: false },
        { name: "leading zero", args: ["01.2.3.4"], expected: false, hidden: true },
        { name: "letters", args: ["1.2.3.a"], expected: false, hidden: true },
      ],
      hints: [
        "Address ko '.' pe todo. Valid tabhi hai jab exactly 4 tukde hon aur har tukda apne aap mein valid number ho.",
        "Har part ke liye check karo: khaali nahi, sirf digits, length 3 se zyada nahi, '0' se shuru nahi (agar length > 1), aur number <= 255. Koi ek bhi fail → false.",
        "JS: const parts = ip.split('.'); if (parts.length !== 4) return false; for (const p of parts) { if (!/^[0-9]{1,3}$/.test(p)) return false; /* leading zero + range check */ }",
      ],
      explainQuestions: [
        { question: "Why is '01.2.3.4' rejected even though 01 equals 1?", keywords: ["leading zero", "ambiguous", "octal", "format"] },
        { question: "Why do you check for digits before converting to a number?", keywords: ["letters", "empty", "number conversion", "invalid"] },
        { question: "Why must each part be between 0 and 255?", keywords: ["byte", "8 bits", "255", "range"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "What happens when you type a URL like google.com into the browser? Focus on DNS.",
        short: "The browser first checks its own cache and the OS cache for the IP of google.com. If it is not there, the OS asks a DNS resolver, which queries a root server, then the .com TLD server, then Google's authoritative name server to get the IP. The answer is cached for its TTL, and the browser opens a TCP connection to that IP on port 443.",
        deep: `1. Browser cache → OS cache → \`/etc/hosts\`.
2. **Recursive resolver** (ISP, 8.8.8.8, 1.1.1.1) does the work.
3. **Root** → referral to **TLD (.com)** → referral to **authoritative** server → A/AAAA record.
4. Cached at each level for the record's **TTL**.
5. Then: TCP handshake, TLS handshake (HTTPS), HTTP request.
- Record types to know: **A** (IPv4), **AAAA** (IPv6), **CNAME** (alias), **MX** (mail), **TXT** (verification).`,
        followUps: ["What is the difference between an A record and a CNAME?", "What is TTL in DNS?", "What is a recursive vs authoritative DNS server?"],
        commonMistake: "Saying the browser asks the root server directly, skipping caches and the recursive resolver.",
        keywords: ["resolver", "root", "tld", "authoritative", "ttl"],
        difficulty: 2,
        roles: ["BACKEND", "DEVOPS", "FULLSTACK", "SDE"],
      },
      {
        question: "What is the difference between localhost, 127.0.0.1 and 0.0.0.0?",
        short: "localhost is a name that resolves to the loopback address 127.0.0.1, which always means this same machine, so traffic never leaves the computer. 0.0.0.0, when a server binds to it, means listen on all network interfaces, so other machines can reach it. That is why apps inside Docker or on cloud servers should bind to 0.0.0.0.",
        deep: `- **127.0.0.1 / ::1** — loopback; only processes on the same host can connect.
- **localhost** — hostname mapped to loopback in \`/etc/hosts\`.
- **0.0.0.0 (bind)** — accept connections on every interface (Wi-Fi, Ethernet, Docker bridge).
- Security: binding a dev database to 0.0.0.0 on a public server exposes it to the internet; combine with a firewall.`,
        followUps: ["Why can't I open my Docker container's app when it binds to 127.0.0.1?", "What is a private IP address?"],
        commonMistake: "Expecting other devices to reach a server that only listens on 127.0.0.1.",
        keywords: ["loopback", "same machine", "all interfaces", "bind"],
        difficulty: 2,
        roles: ["BACKEND", "DEVOPS", "FULLSTACK"],
      },
    ],
  },
  // ───────────────────────────── http-request-response ─────────────────────────────
  {
    slug: "http-request-response",
    estMinutes: 30,
    difficulty: 2,
    prerequisites: ["internet-client-server", "ip-ports-dns"],
    objectives: [
      "Read the parts of an HTTP request: method, path, headers and body",
      "Read the parts of an HTTP response: status code, headers and body",
      "Choose the right method (GET, POST, PUT, PATCH, DELETE) and status code",
      "Debug API calls using status codes and the browser Network tab",
    ],
    technicalDefinition:
      "HTTP (Hypertext Transfer Protocol) is a stateless, application-layer request–response protocol in which a client sends a request consisting of a method, target URL, headers and optional body, and the server returns a response consisting of a status code, headers and optional body.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**HTTP** wo **bhasha (protocol)** hai jisme browser/app aur server baat karte hain. Har baat ek **request** aur ek **response** ka joda hai.

**Request** (client → server) mein hota hai:
- **Method**: kya karna hai — \`GET\` (data do), \`POST\` (naya banao), \`PUT\`/\`PATCH\` (update karo), \`DELETE\` (hata do)
- **URL / path**: kis cheez pe — \`/api/orders/42\`
- **Headers**: extra info — \`Content-Type\`, \`Authorization\`
- **Body** (optional): data, jaise form ya JSON

**Response** (server → client) mein hota hai:
- **Status code**: kya hua — \`200\` OK, \`404\` Not Found, \`500\` Server Error
- **Headers**
- **Body**: asli data — HTML page, JSON, image

**HTTPS** = wahi HTTP, par encrypted.`,
          en: `**HTTP** is the **language (protocol)** that browsers/apps and servers use to talk. Every exchange is a pair: one **request** and one **response**.

A **request** (client → server) has:
- **Method**: what to do — \`GET\` (give data), \`POST\` (create), \`PUT\`/\`PATCH\` (update), \`DELETE\` (remove)
- **URL / path**: on what — \`/api/orders/42\`
- **Headers**: extra info — \`Content-Type\`, \`Authorization\`
- **Body** (optional): data, like a form or JSON

A **response** (server → client) has:
- **Status code**: what happened — \`200\` OK, \`404\` Not Found, \`500\` Server Error
- **Headers**
- **Body**: the actual data — an HTML page, JSON, an image

**HTTPS** is the same HTTP, but encrypted.`,
          hi: `**HTTP** वह **भाषा (प्रोटोकॉल)** है जिसमें ब्राउज़र/ऐप और सर्वर बात करते हैं। हर बातचीत एक **रिक्वेस्ट** और एक **रिस्पॉन्स** की जोड़ी है।

**रिक्वेस्ट** में होता है: **मेथड** (क्या करना है — GET, POST, DELETE), **URL** (किस चीज़ पर), **हेडर्स** (अतिरिक्त जानकारी) और कभी-कभी **बॉडी** (डेटा)।

**रिस्पॉन्स** में होता है: **स्टेटस कोड** (क्या हुआ — 200 ठीक, 404 नहीं मिला, 500 सर्वर में गड़बड़), **हेडर्स** और **बॉडी** (असली डेटा)।

**HTTPS** = वही HTTP, पर एन्क्रिप्टेड।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Railway reservation counter** (purane zamane wala) socho:

- Tum ek **form** bharte ho — yahi **request** hai.
  - Form ke upar likha "**Reservation**" ya "**Cancellation**" = **method** (POST ya DELETE).
  - "Train 12951, Mumbai → Delhi" = **URL/path** (kis cheez pe kaam).
  - Neeche tumhari details — naam, umar, ID proof = **headers** (jaise Authorization).
  - Passenger list = **body**.
- Clerk form padhke jawab deta hai — yahi **response** hai.
  - "Confirmed" = **200 / 201**
  - "Ye train hai hi nahi" = **404 Not Found**
  - "ID proof nahi hai" = **401 Unauthorized**
  - "Aap is quota ke liye eligible nahi" = **403 Forbidden**
  - "Server down hai, baad mein aao" = **500 / 503**
  - Ticket ka printout = response **body**.

Aur clerk tumhe yaad nahi rakhta — har baar naya form, naya ID dikhana. HTTP bhi aisa hi **stateless** hai.`,
          en: `Think of an old-style **railway reservation counter**:

- You fill a **form** — that is the **request**.
  - "Reservation" or "Cancellation" at the top = the **method** (POST or DELETE).
  - "Train 12951, Mumbai → Delhi" = the **URL/path** (what to act on).
  - Your details and ID proof = **headers** (like Authorization).
  - The passenger list = the **body**.
- The clerk reads it and replies — that is the **response**.
  - "Confirmed" = **200 / 201**
  - "No such train" = **404 Not Found**
  - "No ID proof" = **401 Unauthorized**
  - "You are not eligible for this quota" = **403 Forbidden**
  - "System down, come later" = **500 / 503**
  - The printed ticket = the response **body**.

The clerk does not remember you — every visit needs a new form and ID. HTTP is **stateless** in the same way.`,
          hi: `पुराने ज़माने का **रेलवे रिज़र्वेशन काउंटर** सोचो:

- तुम एक **फ़ॉर्म** भरते हो — यही **रिक्वेस्ट** है। ऊपर "रिज़र्वेशन" या "कैंसलेशन" = **मेथड**। ट्रेन नंबर = **URL**। तुम्हारा पहचान पत्र = **हेडर**। यात्रियों की सूची = **बॉडी**।
- क्लर्क फ़ॉर्म पढ़कर जवाब देता है — यही **रिस्पॉन्स** है। "कन्फ़र्म" = 200, "ऐसी कोई ट्रेन नहीं" = 404, "पहचान पत्र नहीं है" = 401, "सिस्टम बंद है" = 500। टिकट का प्रिंट = रिस्पॉन्स की बॉडी।

क्लर्क तुम्हें याद नहीं रखता — हर बार नया फ़ॉर्म। HTTP भी ऐसा ही **स्टेटलेस** है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Internet pe hazaaron tarah ke clients (Chrome, Android app, iPhone app, Postman, ek Python script) aur hazaaron tarah ke servers (Node, Django, Java, Go) hain. Agar har ek apni marzi ki bhasha bole, toh koi kisi ko samajh hi nahi paayega.

HTTP ek **common agreement** hai:

- Request ka format fixed hai, toh **koi bhi client koi bhi server** se baat kar sakta hai — Python script aur React app dono same API call kar sakte hain.
- **Status codes** se bina body padhe pata chal jaata hai kya hua — 2xx sab theek, 4xx client ki galti, 5xx server ki galti.
- **Methods** se intention clear hai — GET safe hai (kuch badalta nahi), DELETE kuch hataayega.
- **Headers** se extra cheezein standard tareeke se — login token, caching, data ka type.

Backend ya frontend, dono developer ka 50% kaam HTTP requests bhejna ya handle karna hai. Isliye ye foundation hai.`,
          en: `The internet has thousands of kinds of clients (Chrome, Android apps, iPhone apps, Postman, a Python script) and servers (Node, Django, Java, Go). If each spoke its own language, nobody would understand anybody.

HTTP is a **common agreement**:

- The request format is fixed, so **any client can talk to any server** — a Python script and a React app can call the same API.
- **Status codes** tell you what happened without reading the body — 2xx all good, 4xx client's mistake, 5xx server's mistake.
- **Methods** make the intention clear — GET is safe (changes nothing), DELETE removes something.
- **Headers** carry extras in a standard way — login tokens, caching, data type.

Half of a frontend or backend developer's work is sending or handling HTTP requests. That is why this is a foundation.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `HTTP har app ki nas nas mein hai:

- **Swiggy app**: restaurants list = \`GET /restaurants?lat=..&lng=..\`, cart mein add = \`POST /cart\`, item hatana = \`DELETE /cart/items/7\`. Har ek ek HTTP request hai.
- **Razorpay**: payment ke baad Razorpay tumhare server ko ek **webhook** bhejta hai — ek \`POST\` request JSON body ke saath: "payment successful". Tumhara server \`200\` return karke batata hai "mil gaya".
- **GitHub API**: \`GET https://api.github.com/users/<username>\` se kisi ka public profile JSON mein milta hai. Rate limit cross karo toh \`403\` ya \`429 Too Many Requests\` milta hai.

Developers in requests ko test karne ke liye **Postman**, **curl** ya **Thunder Client** (VS Code) use karte hain — bina frontend banaye API check ho jaati hai.`,
          en: `HTTP runs through every app:

- **Swiggy app**: restaurant list = \`GET /restaurants?lat=..&lng=..\`, add to cart = \`POST /cart\`, remove an item = \`DELETE /cart/items/7\`. Each is an HTTP request.
- **Razorpay**: after a payment, Razorpay sends your server a **webhook** — a \`POST\` request with a JSON body saying "payment successful". Your server returns \`200\` to say "received".
- **GitHub API**: \`GET https://api.github.com/users/<username>\` returns a public profile as JSON. Exceed the rate limit and you get \`403\` or \`429 Too Many Requests\`.

Developers test these requests with **Postman**, **curl** or **Thunder Client** (VS Code) — you can check an API without building a frontend.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `HTTP/1.1 andar se **plain text** hai. Ek request aisi dikhti hai:

\`\`\`
POST /api/orders HTTP/1.1
Host: api.foodapp.example
Content-Type: application/json
Authorization: Bearer eyJhbGci...

{"item": "paneer roll", "qty": 2}
\`\`\`

1. **Pehli line (request line)**: method, path, version.
2. **Headers**: \`Naam: value\` wali lines.
3. **Ek khaali line** — headers khatam.
4. **Body**.

Response bhi same pattern:

\`\`\`
HTTP/1.1 201 Created
Content-Type: application/json

{"orderId": 142, "status": "placed"}
\`\`\`

Status codes ke families: **1xx** info, **2xx** success, **3xx** redirect (\`301\`, \`302\`), **4xx** client error (\`400\`, \`401\`, \`403\`, \`404\`), **5xx** server error (\`500\`, \`502\`, \`503\`).

Ye text TCP connection pe jaata hai (HTTPS mein TLS se encrypt hoke). HTTP/2 aur HTTP/3 isi ko binary aur fast bana dete hain, par meaning same rehta hai.`,
          en: `Inside, HTTP/1.1 is **plain text**. A request looks like:

\`\`\`
POST /api/orders HTTP/1.1
Host: api.foodapp.example
Content-Type: application/json
Authorization: Bearer eyJhbGci...

{"item": "paneer roll", "qty": 2}
\`\`\`

1. **First line (request line)**: method, path, version.
2. **Headers**: \`Name: value\` lines.
3. **An empty line** — headers end.
4. **Body**.

The response follows the same pattern:

\`\`\`
HTTP/1.1 201 Created
Content-Type: application/json

{"orderId": 142, "status": "placed"}
\`\`\`

Status families: **1xx** info, **2xx** success, **3xx** redirect, **4xx** client error, **5xx** server error. This text travels over a TCP connection (encrypted by TLS for HTTPS). HTTP/2 and HTTP/3 make it binary and faster, but the meaning stays the same.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yahan koi network call nahi — hum ek **raw HTTP request aur response ko text lines ki tarah** lete hain aur khud parse karte hain, jaise server aur browser karte hain.

1. \`requestLines\` ek request hai. Pehli line ko \`split(" ")\` karke **method, path, version** nikalte hain.
2. \`responseLines\` ek response hai. Pehli line (status line) se **status code** (number) aur **reason** ("OK") nikalte hain.
3. Loop headers padhta hai jab tak **khaali line** na aaye. Header names ko lowercase karte hain kyunki HTTP headers case-insensitive hote hain.
4. Khaali line ke baad wali line **body** hai — use \`JSON.parse\` / \`json.loads\` se object banate hain.
5. Last mein status code ki family check karte hain: \`200–299\` = success.`,
          en: `There is no network call here — we take a **raw HTTP request and response as lines of text** and parse them ourselves, like servers and browsers do.

1. \`requestLines\` is a request. Splitting the first line on spaces gives the **method, path and version**.
2. \`responseLines\` is a response. The first line (status line) gives the **status code** (a number) and the **reason** ("OK").
3. A loop reads headers until it reaches an **empty line**. Header names are lowercased because HTTP headers are case-insensitive.
4. The line after the empty line is the **body** — we turn it into an object with \`JSON.parse\` / \`json.loads\`.
5. Finally we check the status family: \`200–299\` means success.`,
        },
        codeJs: `const requestLines = [
  "GET /api/orders/42 HTTP/1.1",
  "Host: api.foodapp.example",
  "Accept: application/json",
  "Authorization: Bearer abc123",
];
console.log("--- request ---");
requestLines.forEach((line) => console.log(line));
const [method, path, version] = requestLines[0].split(" ");
console.log("method:", method, "| path:", path, "| version:", version);

const responseLines = [
  "HTTP/1.1 200 OK",
  "Content-Type: application/json",
  "Cache-Control: no-cache",
  "",
  '{"id":42,"status":"out for delivery","eta":12}',
];
console.log("--- response ---");
const statusParts = responseLines[0].split(" ");
const code = Number(statusParts[1]);
const reason = statusParts.slice(2).join(" ");
console.log("status:", code, reason);

const headers = {};
let i = 1;
while (responseLines[i] !== "") {
  const sep = responseLines[i].indexOf(": ");
  const name = responseLines[i].slice(0, sep).toLowerCase();
  headers[name] = responseLines[i].slice(sep + 2);
  i++;
}
console.log("content-type:", headers["content-type"]);

const body = JSON.parse(responseLines[i + 1]);
console.log("order", body.id, "is", body.status, "- ETA", body.eta, "min");
console.log("success?", code >= 200 && code < 300);
`,
        codePython: `import json

request_lines = [
    "GET /api/orders/42 HTTP/1.1",
    "Host: api.foodapp.example",
    "Accept: application/json",
    "Authorization: Bearer abc123",
]
print("--- request ---")
for line in request_lines:
    print(line)
method, path, version = request_lines[0].split(" ")
print("method:", method, "| path:", path, "| version:", version)

response_lines = [
    "HTTP/1.1 200 OK",
    "Content-Type: application/json",
    "Cache-Control: no-cache",
    "",
    '{"id":42,"status":"out for delivery","eta":12}',
]
print("--- response ---")
status_parts = response_lines[0].split(" ")
code = int(status_parts[1])
reason = " ".join(status_parts[2:])
print("status:", code, reason)

headers = {}
i = 1
while response_lines[i] != "":
    name, value = response_lines[i].split(": ", 1)
    headers[name.lower()] = value
    i += 1
print("content-type:", headers["content-type"])

body = json.loads(response_lines[i + 1])
print("order", body["id"], "is", body["status"], "- ETA", body["eta"], "min")
print("success?", 200 <= code < 300)
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `HTTP ki common galtiyan:

- **Har cheez ke liye GET**: \`GET /deleteUser?id=5\` — galat! GET se data badalna nahi chahiye; browser ya crawler ise khud call kar sakta hai. Delete ke liye \`DELETE\`.
- **Error pe bhi \`200\` bhejna**: \`{ "error": "not found" }\` ke saath status 200. Client samjhega sab theek hai. Sahi status code bhejo.
- **401 vs 403 mix karna**: \`401\` = "tum kaun ho? login karo", \`403\` = "pata hai tum kaun ho, par permission nahi".
- **\`Content-Type\` bhool jaana**: JSON body bheji par header \`application/json\` nahi lagaya → server ko body khaali milti hai.
- **fetch() ko error-proof samajhna**: JavaScript ka \`fetch\` **404 ya 500 pe error throw nahi karta**. \`response.ok\` khud check karna padta hai.
- **Sensitive data URL mein daalna**: \`?password=...\` logs aur browser history mein save ho jaata hai. Body + HTTPS use karo.`,
          en: `Common HTTP mistakes:

- **Using GET for everything**: \`GET /deleteUser?id=5\` is wrong. GET should not change data; browsers or crawlers might call it on their own. Use \`DELETE\`.
- **Sending \`200\` for errors**: \`{ "error": "not found" }\` with status 200 makes the client think all is well. Send the right status code.
- **Mixing up 401 and 403**: \`401\` = "who are you? please log in"; \`403\` = "I know who you are, but you are not allowed".
- **Forgetting \`Content-Type\`**: you send a JSON body without \`application/json\` → the server sees an empty body.
- **Assuming fetch() throws on errors**: JavaScript's \`fetch\` does **not** throw on 404 or 500. Check \`response.ok\` yourself.
- **Putting secrets in the URL**: \`?password=...\` ends up in logs and history. Use the body and HTTPS.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `API kaam nahi kar rahi? **Status code se shuru karo**:

1. **Browser DevTools → Network tab** (F12) kholo, request pe click karo. Dekho: URL, method, status, request headers, request body (Payload), aur Response.
2. **4xx = request mein galti** (tumhari side):
   - \`400\` → body ka format galat / field missing. Payload dekho.
   - \`401\` → token missing ya expire. \`Authorization\` header check karo.
   - \`403\` → permission nahi.
   - \`404\` → URL/path ya ID galat. Typo? \`/api/order\` vs \`/api/orders\`?
   - \`405\` → method galat (POST chahiye tha, GET bheja).
3. **5xx = server mein galti**: \`500\` → **server logs** dekho, wahan stack trace milega. \`502/504\` → server ke peeche wali service down ya slow.
4. Request **dikhi hi nahi** ya red "(failed)" / CORS error → server tak pahunchi hi nahi.
5. Same request **curl ya Postman** se bhejo — wahan chale toh problem frontend code mein hai.`,
          en: `API not working? **Start with the status code**:

1. Open **browser DevTools → Network tab** (F12) and click the request. Check the URL, method, status, request headers, request body (Payload) and Response.
2. **4xx = a problem with the request** (your side):
   - \`400\` → wrong body format or a missing field. Check the payload.
   - \`401\` → missing or expired token. Check the \`Authorization\` header.
   - \`403\` → no permission.
   - \`404\` → wrong URL/path or ID. A typo like \`/api/order\` vs \`/api/orders\`?
   - \`405\` → wrong method (sent GET, needed POST).
3. **5xx = a server problem**: \`500\` → read the **server logs** for the stack trace. \`502/504\` → a service behind the server is down or slow.
4. Request **not visible**, or a red "(failed)" / CORS error → it never reached the server.
5. Send the same request with **curl or Postman** — if it works there, the bug is in your frontend code.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `HTTP request–response simple aur universal hai, par har situation ke liye best nahi:

- **Live updates (chat, cricket score, delivery tracking)**: HTTP mein server khud message nahi bhej sakta. Baar baar poochna (**polling**) waste hai. Alternatives: **WebSockets** (dono taraf hamesha khula connection — chat apps), **Server-Sent Events** (server → client stream, jaise live score), ya mobile **push notifications**.
- **Stateless**: har request mein token bhejna padta hai — thoda overhead, par isi wajah se servers ko scale karna easy hai (koi bhi server koi bhi request handle kar sakta hai).
- **Text headers ka overhead**: bahut chhoti, bahut zyada requests (microservices ke beech) ke liye **gRPC** (HTTP/2 + binary Protobuf) fast hota hai.
- **REST vs GraphQL**: REST mein har resource ka alag URL; GraphQL mein ek endpoint jahan client exactly bolta hai kya chahiye.

Shuru mein: **simple REST over HTTPS** almost hamesha sahi default hai.`,
          en: `HTTP request–response is simple and universal, but not best for every case:

- **Live updates (chat, cricket score, delivery tracking)**: in HTTP the server cannot send a message on its own. Asking again and again (**polling**) is wasteful. Alternatives: **WebSockets** (an always-open two-way connection — chat apps), **Server-Sent Events** (a server → client stream, like live scores), or mobile **push notifications**.
- **Stateless**: every request must carry a token — a little overhead, but it makes scaling easy because any server can handle any request.
- **Text header overhead**: for many tiny requests between microservices, **gRPC** (HTTP/2 + binary Protobuf) is faster.
- **REST vs GraphQL**: REST has a URL per resource; GraphQL has one endpoint where the client asks for exactly what it needs.

To start, **simple REST over HTTPS** is almost always the right default.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `**Todo / task app** ka backend design karte waqt tum HTTP ke hisaab se sochte ho:

- \`GET /api/tasks\` → saare tasks, \`200\`
- \`POST /api/tasks\` body \`{"title": "DBMS assignment"}\` → naya task, \`201 Created\`
- \`PATCH /api/tasks/7\` body \`{"done": true}\` → update, \`200\`
- \`DELETE /api/tasks/7\` → \`204 No Content\`
- Title khaali bheja → \`400\` + error message
- Login nahi → \`401\`; doosre user ka task → \`403\`; task 999 hai hi nahi → \`404\`

Frontend mein:

\`\`\`
const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
if (!res.ok) showError(res.status);
\`\`\`

Logging/monitoring dashboard mein status codes ko families mein group karte ho ("kitne 5xx aaj?") — yahi is topic ka build task hai.`,
          en: `When designing the backend of a **todo / task app**, you think in HTTP:

- \`GET /api/tasks\` → all tasks, \`200\`
- \`POST /api/tasks\` with \`{"title": "DBMS assignment"}\` → new task, \`201 Created\`
- \`PATCH /api/tasks/7\` with \`{"done": true}\` → update, \`200\`
- \`DELETE /api/tasks/7\` → \`204 No Content\`
- Empty title → \`400\` with an error message
- Not logged in → \`401\`; another user's task → \`403\`; task 999 missing → \`404\`

In the frontend:

\`\`\`
const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
if (!res.ok) showError(res.status);
\`\`\`

A monitoring dashboard groups status codes into families ("how many 5xx today?") — that is this topic's build task.`,
        },
      },
    ],
    visualization: {
      kind: "REQUEST_RESPONSE",
      title: "Order status check: ek HTTP round trip",
      steps: [
        { title: "Client request banata hai", description: "App bhejta hai: GET /api/orders/42 HTTP/1.1, headers mein Host aur Authorization token.", highlight: "GET /api/orders/42" },
        { title: "Connection + bhejna", description: "DNS se IP mila, port 443 pe TCP + TLS connection bana, aur request ka text bytes ban ke gaya.", highlight: "IP:443" },
        { title: "Server route karta hai", description: "Server method + path dekh ke sahi handler chalata hai, token verify karta hai aur database se order 42 nikalta hai.", highlight: "handler" },
        { title: "Response aata hai", description: "Server bhejta hai: HTTP/1.1 200 OK, Content-Type: application/json, aur body mein order ka JSON.", highlight: "200 OK" },
        { title: "Client use karta hai", description: "App status code check karta hai (2xx = success), JSON parse karta hai aur screen pe 'Out for delivery' dikhata hai.", highlight: "response.ok" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which HTTP method should you use to fetch data without changing anything on the server?",
        options: ["GET", "POST", "DELETE", "PATCH"],
        correct: [0],
        explanation: "GET sirf data maangta hai, kuch badalta nahi (safe method). POST banata hai, PATCH update karta hai, DELETE hataata hai.",
        tags: ["methods"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does the status code 404 mean?",
        options: ["Not Found", "Server crashed", "Success", "Unauthorized"],
        correct: [0],
        explanation: "404 = jo resource/URL maanga wo server pe nahi mila. Server crash 500 hota hai, success 200, unauthorized 401.",
        tags: ["status-codes"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "What is the difference between 401 and 403?",
        options: [
          "401 means you are not authenticated (log in first); 403 means you are authenticated but not allowed",
          "401 means the server crashed; 403 means the page moved",
          "They mean exactly the same thing",
          "401 is for GET requests and 403 is for POST requests",
        ],
        correct: [0],
        explanation: "401 = 'pehle batao tum kaun ho' (login/token missing). 403 = 'pata hai tum kaun ho, par ye tumhare liye allowed nahi'.",
        tags: ["status-codes"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these are parts of an HTTP REQUEST?",
        options: ["Method", "Path / URL", "Headers", "Status code"],
        correct: [0, 1, 2],
        explanation: "Request mein method, path, headers (aur optional body) hote hain. Status code response ka hissa hai — server batata hai kya hua.",
        tags: ["structure"],
      },
      {
        type: "SPOT_BUG",
        difficulty: 2,
        prompt: "This code always prints 'Success!' even when the server fails. What is the bug?",
        code: `const response = { status: 500, body: "DB down" };
if (response.status = 200) {
  console.log("Success!");
} else {
  console.log("Failed");
}`,
        codeLanguage: "javascript",
        options: [
          "A single = assigns 200 instead of comparing, so the condition is always truthy",
          "500 is actually a success status code",
          "The body must be JSON, not a string",
          "There is no bug; it prints Failed",
        ],
        correct: [0],
        explanation: "= assignment hai, === comparison. response.status = 200 status ko 200 bana deta hai aur 200 truthy hai, isliye hamesha Success! Sahi: response.status === 200 (ya 2xx range check).",
        tags: ["code", "bug"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "Your frontend form submit gets a 500 response from your own API. Where should you look first?",
        options: [
          "The server logs, because 5xx means the server failed while handling the request",
          "Your Wi-Fi router settings",
          "The browser's cache settings",
          "Change the URL from http to https",
        ],
        correct: [0],
        explanation: "5xx = server side ki galti. Request pahunch gayi thi, server ke code mein kuch crash hua. Server logs mein stack trace milega.",
        tags: ["debugging"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Put the steps of one HTTP exchange in order.",
        options: [
          "The client opens a connection to the server's IP and port",
          "The client sends the request line, headers and optional body",
          "The server routes the request and runs the matching handler",
          "The server sends back a status line, headers and body",
          "The client checks the status code and uses the body",
        ],
        explanation: "Connection → request bhejna → server process → response → client status dekh ke body use karta hai. Har HTTP call yahi cycle hai.",
        tags: ["flow"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "HTTP is called 'stateless'. What does that mean, and how do websites still keep you logged in?",
        keywords: ["stateless", "each request", "independent", "cookie", "token"],
        explanation: "Stateless = har request independent hai, server pichli request yaad nahi rakhta. Login bana rehta hai kyunki browser har request ke saath cookie ya token bhejta hai jisse server tumhe pehchaanta hai.",
        tags: ["concepts"],
      },
    ],
    buildTask: {
      title: "Status code classifier",
      description: `Monitoring dashboards status codes ko families mein group karte hain. Function **\`statusCategory(code)\`** likho jo ek integer le aur string return kare:

- \`100–199\` → \`"informational"\`
- \`200–299\` → \`"success"\`
- \`300–399\` → \`"redirect"\`
- \`400–499\` → \`"client error"\`
- \`500–599\` → \`"server error"\`
- baaki sab → \`"invalid"\``,
      functionName: "statusCategory",
      starterJs: `function statusCategory(code) {
  // TODO: check which hundred-range the code falls in
}
`,
      starterPython: `def statusCategory(code):
    # TODO: check which hundred-range the code falls in
    pass
`,
      tests: [
        { name: "OK", args: [200], expected: "success" },
        { name: "moved permanently", args: [301], expected: "redirect" },
        { name: "not found", args: [404], expected: "client error" },
        { name: "internal server error", args: [500], expected: "server error" },
        { name: "too big", args: [600], expected: "invalid" },
        { name: "early hints", args: [103], expected: "informational", hidden: true },
        { name: "below range", args: [99], expected: "invalid", hidden: true },
      ],
      hints: [
        "Status code ka pehla digit hi family batata hai: 2xx success, 4xx client error, waghera.",
        "Range checks likho: 100 <= code < 200, 200 <= code < 300 ... Koi match na ho toh 'invalid'. Ya code ko 100 se divide karke (floor) pehla digit nikalo aur 1–5 ke liye map karo.",
        "Python: if 200 <= code < 300: return 'success'  |  JS: const family = Math.floor(code / 100); const names = { 1: 'informational', 2: 'success', 3: 'redirect', 4: 'client error', 5: 'server error' };",
      ],
      explainQuestions: [
        { question: "Why is 600 invalid even though Math.floor(600 / 100) gives a number?", keywords: ["range", "6", "no family", "invalid"] },
        { question: "What is the difference between a 4xx and a 5xx error?", keywords: ["client", "server", "request", "fault"] },
        { question: "How did you make sure 99 is not treated as informational?", keywords: ["lower bound", "100", "range", "check"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "Explain the structure of an HTTP request and response.",
        short: "A request has a request line with the method, path and HTTP version, then headers, a blank line, and an optional body. A response has a status line with the version, status code and reason phrase, then headers, a blank line, and an optional body. For example, GET /users/1 might return 200 OK with a JSON body.",
        deep: `- **Request**: \`POST /api/orders HTTP/1.1\` → headers (\`Host\`, \`Content-Type\`, \`Authorization\`, \`Cookie\`) → blank line → body.
- **Response**: \`HTTP/1.1 201 Created\` → headers (\`Content-Type\`, \`Set-Cookie\`, \`Cache-Control\`, \`Location\`) → blank line → body.
- Headers are case-insensitive. \`Content-Length\` or chunked encoding tells where the body ends.
- HTTP/2 and HTTP/3 keep the same semantics but use binary frames and multiplexing.`,
        followUps: ["What is the Host header used for?", "What is the difference between PUT and PATCH?", "Which methods are idempotent?"],
        commonMistake: "Forgetting that the status code belongs to the response, or that GET requests should not have side effects.",
        keywords: ["method", "headers", "status code", "body"],
        difficulty: 1,
        roles: ["BACKEND", "FRONTEND", "FULLSTACK", "SDE"],
      },
      {
        question: "What does it mean that an HTTP method is idempotent? Which methods are?",
        short: "An idempotent method gives the same server state whether you send the request once or many times. GET, PUT, DELETE and HEAD are idempotent; POST is not, because sending it twice usually creates two resources. This matters for safe retries when the network fails.",
        deep: `- **Safe** (no state change): GET, HEAD, OPTIONS.
- **Idempotent**: GET, HEAD, OPTIONS, PUT, DELETE. Deleting order 7 twice still leaves it deleted.
- **Not idempotent**: POST (two orders), usually PATCH.
- Payments use an **idempotency key** header so a retried POST is processed only once (Stripe and Razorpay support this).`,
        followUps: ["How would you make a payment POST safe to retry?", "Is PATCH idempotent?"],
        commonMistake: "Saying idempotent means the response is identical; it is about the effect on server state.",
        keywords: ["same result", "retry", "put", "post", "idempotency key"],
        difficulty: 3,
        roles: ["BACKEND", "SDE", "FULLSTACK"],
      },
      {
        question: "What is the difference between 4xx and 5xx status codes? Give examples.",
        short: "4xx codes mean the client sent a request the server will not process, like 400 Bad Request, 401 Unauthorized, 403 Forbidden or 404 Not Found. 5xx codes mean the request may be fine but the server failed, like 500 Internal Server Error, 502 Bad Gateway or 503 Service Unavailable. Clients should fix and not blindly retry 4xx, while some 5xx errors can be retried.",
        deep: `- **4xx**: 400 validation, 401 missing/expired auth, 403 forbidden, 404 missing resource, 409 conflict, 422 unprocessable, 429 rate limited.
- **5xx**: 500 unhandled exception, 502 upstream bad response, 503 overloaded/maintenance, 504 upstream timeout.
- Monitoring: a spike in 5xx usually means an incident; a spike in 4xx may mean a broken client release.`,
        followUps: ["When would you return 422 instead of 400?", "What causes a 502 behind Nginx?"],
        commonMistake: "Returning 500 for validation errors, or 200 with an error message in the body.",
        keywords: ["client error", "server error", "retry", "404", "500"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK", "DEVOPS"],
      },
    ],
    promptCard: {
      title: "Debug a failing API request",
      category: "DEBUGGING",
      task: "Find out why an HTTP request to an API fails, using the request and response details.",
      whenToUse: "When fetch/axios/requests returns an error status, an empty body, or a CORS error and you are not sure if the bug is in the client or the server.",
      template: `I am calling an API and it is not working.

Request I sent:
- Method and URL: [METHOD_AND_URL]
- Headers: [REQUEST_HEADERS]
- Body: [REQUEST_BODY]

Response I got:
- Status code: [STATUS_CODE]
- Response body: [RESPONSE_BODY]

My client code ([LANGUAGE]):
[CLIENT_CODE]

Please:
1. Tell me if this looks like a client-side (4xx) or server-side (5xx) problem, and why.
2. List the most likely causes in order.
3. Show the corrected request or code.
4. Give me a curl command I can run to test the fixed request.`,
      variables: [
        { key: "METHOD_AND_URL", label: "e.g. POST https://api.example.com/v1/orders" },
        { key: "REQUEST_HEADERS", label: "Headers from the DevTools Network tab (hide real tokens)" },
        { key: "REQUEST_BODY", label: "The JSON or form body you sent" },
        { key: "STATUS_CODE", label: "The status code, e.g. 400" },
        { key: "RESPONSE_BODY", label: "The response body or error message" },
        { key: "LANGUAGE", label: "JavaScript (fetch/axios) or Python (requests)" },
        { key: "CLIENT_CODE", label: "The code that makes the request" },
      ],
      whyItWorks: [
        { part: "Full request and response", why: "Most API bugs are visible in the exact headers, body and status; the AI does not have to guess." },
        { part: "Status code first", why: "Classifying 4xx vs 5xx immediately tells you which side to fix." },
        { part: "Client code", why: "Common bugs like a missing Content-Type or not awaiting response.json() live in the client code." },
        { part: "curl command", why: "Lets you test the request outside your app, isolating frontend bugs from API bugs." },
      ],
      verifyChecklist: [
        "Remove or mask real tokens and passwords before pasting",
        "Run the suggested curl command and compare its status code with your app's",
        "Check the status code changes to 2xx after the fix",
        "If it was a 5xx, confirm the cause in the server logs instead of trusting the guess",
      ],
      sampleOutput: `**Diagnosis:** 400 Bad Request is a client-side problem. Your body is sent as a JavaScript object string, but the \`Content-Type: application/json\` header is missing, so the server cannot parse it and sees no \`title\` field.

**Fix:**
\`\`\`
fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "DBMS assignment" }) })
\`\`\`

**Test:** \`curl -X POST https://api.example.com/v1/tasks -H "Content-Type: application/json" -d '{"title":"DBMS assignment"}'\``,
    },
  },
  // ───────────────────────────── json-basics ─────────────────────────────
  {
    slug: "json-basics",
    estMinutes: 20,
    difficulty: 1,
    prerequisites: ["http-request-response"],
    objectives: [
      "Read and write valid JSON with objects, arrays and the six value types",
      "Convert between JSON text and objects in JavaScript and Python",
      "Spot common invalid-JSON mistakes like single quotes and trailing commas",
      "Walk nested JSON data from a real API response",
    ],
    technicalDefinition:
      "JSON (JavaScript Object Notation) is a language-independent, text-based data interchange format that represents data as objects (unordered key–value pairs with string keys), arrays, strings, numbers, booleans and null.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**JSON (JavaScript Object Notation)** data ko **text** ke roop mein likhne ka ek simple format hai, jise insaan bhi padh sake aur har programming language bhi samajh sake.

\`\`\`
{
  "name": "Priya",
  "age": 21,
  "skills": ["python", "sql"],
  "placed": false,
  "offer": null
}
\`\`\`

JSON mein sirf ye cheezein hoti hain:
- **Object** \`{ }\`: key–value pairs. **Keys hamesha double quotes** mein.
- **Array** \`[ ]\`: values ki list.
- **Values**: string (\`"double quotes"\`), number (\`21\`, \`4.5\`), boolean (\`true\`/\`false\`), \`null\`, ya phir aur object/array.

Bas! Na functions, na comments, na dates. Aaj kal almost har API data JSON mein hi bhejti hai.`,
          en: `**JSON (JavaScript Object Notation)** is a simple format for writing data as **text** that humans can read and every programming language can understand.

\`\`\`
{
  "name": "Priya",
  "age": 21,
  "skills": ["python", "sql"],
  "placed": false,
  "offer": null
}
\`\`\`

JSON has only these things:
- **Object** \`{ }\`: key–value pairs. **Keys always use double quotes.**
- **Array** \`[ ]\`: a list of values.
- **Values**: string (\`"double quotes"\`), number (\`21\`, \`4.5\`), boolean (\`true\`/\`false\`), \`null\`, or another object/array.

That is all — no functions, no comments, no dates. Almost every API today sends data as JSON.`,
          hi: `**JSON** डेटा को **टेक्स्ट** के रूप में लिखने का एक सरल तरीका है, जिसे इंसान भी पढ़ सके और हर प्रोग्रामिंग भाषा भी समझ सके।

JSON में सिर्फ़ ये चीज़ें होती हैं:
- **ऑब्जेक्ट** \`{ }\`: key–value जोड़े। Key हमेशा डबल कोट्स में।
- **ऐरे** \`[ ]\`: values की सूची।
- **Values**: string, number, boolean (\`true\`/\`false\`), \`null\`, या कोई और ऑब्जेक्ट/ऐरे।

बस इतना ही — न फ़ंक्शन, न कमेंट। आजकल लगभग हर API डेटा JSON में ही भेजती है। जैसे: \`{"name": "Priya", "age": 21}\`।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Aadhaar card ya college ID card** socho.

Har card pe fixed **labels** hain aur unke saamne **values**:

- Naam: Priya Sharma
- Roll No: 21CS042
- Branch: CSE
- Hostel: Yes

Format sabke liye same hai, isliye koi bhi guard, koi bhi office card dekh ke turant samajh jaata hai — chahe wo kisi bhi state ka ho, koi bhi bhasha bolta ho.

JSON bhi exactly yahi hai: **label (key) → value**, ek fixed format mein. JavaScript server ho, Python script ho, ya Android app — sab is "ID card" ko padh sakte hain.

Aur jaise ID card pe ek se zyada phone numbers ho sakte hain, waise JSON mein **array** hota hai: \`"phones": ["98xxx", "99xxx"]\`. Address ke andar city, pin alag — wo **nested object** hai. Bas format galat mat karna — label ke bina value, ya ulti-seedhi likhawat, toh "card invalid"!`,
          en: `Think of an **Aadhaar card or college ID card**.

Each card has fixed **labels** with **values**:

- Name: Priya Sharma
- Roll No: 21CS042
- Branch: CSE
- Hostel: Yes

The format is the same for everyone, so any guard or office understands it instantly — whatever state they are from or language they speak.

JSON is exactly this: **label (key) → value**, in a fixed format. A JavaScript server, a Python script or an Android app can all read this "ID card".

Just as a card might list more than one phone number, JSON has **arrays**: \`"phones": ["98xxx", "99xxx"]\`. An address with its own city and pin is a **nested object**. Break the format and the "card is invalid"!`,
          hi: `**आधार कार्ड या कॉलेज ID कार्ड** सोचो।

हर कार्ड पर तय **लेबल** हैं और उनके सामने **values**: नाम, रोल नंबर, ब्रांच, हॉस्टल।

फ़ॉर्मेट सबके लिए एक जैसा है, इसलिए कोई भी गार्ड या दफ़्तर कार्ड देखकर तुरंत समझ जाता है — चाहे वह किसी भी राज्य का हो या कोई भी भाषा बोलता हो।

JSON भी यही है: **लेबल (key) → value**, एक तय फ़ॉर्मेट में। JavaScript सर्वर हो, Python स्क्रिप्ट हो या Android ऐप — सब इस "ID कार्ड" को पढ़ सकते हैं। फ़ॉर्मेट तोड़ा तो "कार्ड अमान्य"!`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Server pe data **objects** (JS) ya **dicts** (Python) ke roop mein memory mein hota hai. Par network pe memory nahi jaati — sirf **text/bytes** jaate hain. Aur doosri taraf koi aur language ho sakti hai. Toh ek common **text format** chahiye.

Pehle **XML** use hota tha:

\`\`\`
<student><name>Priya</name><age>21</age></student>
\`\`\`

Lamba, bhaari, padhne mein mushkil. JSON ne ye solve kiya:

- **Chhota aur readable**: \`{"name": "Priya", "age": 21}\`
- **Language-independent**: JS, Python, Java, Go — sabke paas built-in JSON support.
- **Seedha mapping**: JSON object = JS object = Python dict. JSON array = JS array = Python list.

Isliye REST APIs, config files (\`package.json\`, \`tsconfig.json\`), aur MongoDB jaise databases — sab JSON (ya uske cousin) pe chalte hain. Bina JSON samjhe ek bhi API call handle karna mushkil hai.`,
          en: `On a server, data lives in memory as **objects** (JS) or **dicts** (Python). But memory cannot travel over a network — only **text/bytes** can. And the other side may use a different language. So we need a common **text format**.

Earlier, **XML** was common:

\`\`\`
<student><name>Priya</name><age>21</age></student>
\`\`\`

Long, heavy and hard to read. JSON fixed this:

- **Short and readable**: \`{"name": "Priya", "age": 21}\`
- **Language-independent**: JS, Python, Java and Go all have built-in JSON support.
- **Direct mapping**: JSON object = JS object = Python dict. JSON array = JS array = Python list.

That is why REST APIs, config files (\`package.json\`, \`tsconfig.json\`) and databases like MongoDB all use JSON or its cousins.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `JSON har jagah dikhega:

- **Zomato / Swiggy APIs**: app ko restaurants ki list aisi milti hai: \`{"restaurants": [{"name": "Haldiram's", "rating": 4.3, "deliveryTime": 30}]}\`. App isi ko parse karke cards dikhata hai.
- **npm (Node.js)**: har JS project ka \`package.json\` — project ka naam, version, dependencies, scripts — sab JSON mein.
- **MongoDB**: data "documents" ki tarah store hota hai jo JSON jaise dikhte hain (andar BSON — binary JSON). Kai Indian startups ka backend isi pe hai.
- **OpenAI / Claude jaise AI APIs**: request aur response dono JSON — \`{"model": "...", "messages": [...]}\`.

Browser DevTools ke Network tab mein kisi bhi website ki API call kholo — Response mein 90% chance JSON hi milega.`,
          en: `You will see JSON everywhere:

- **Zomato / Swiggy APIs**: the app receives restaurant lists like \`{"restaurants": [{"name": "Haldiram's", "rating": 4.3, "deliveryTime": 30}]}\` and turns them into cards.
- **npm (Node.js)**: every JS project's \`package.json\` — name, version, dependencies, scripts — is JSON.
- **MongoDB** stores data as "documents" that look like JSON (internally BSON — binary JSON). Many Indian startups run their backends on it.
- **AI APIs like OpenAI or Claude**: both request and response are JSON — \`{"model": "...", "messages": [...]}\`.

Open the Network tab in browser DevTools on any website — the API response is almost always JSON.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `JSON ke saath do main operations hote hain:

1. **Serialize (object → text)**: memory ke object ko JSON string banana, taaki bheja ya save kiya ja sake.
   - JS: \`JSON.stringify(obj)\`
   - Python: \`json.dumps(obj)\`
2. **Parse / deserialize (text → object)**: aaye hue text ko wapas object banana, taaki \`data.name\` jaisa use kar sako.
   - JS: \`JSON.parse(text)\` (aur \`fetch\` mein \`await response.json()\`)
   - Python: \`json.loads(text)\`

Parser andar se text ko **character by character** padhta hai: \`{\` dikha → object shuru, \`"\` → string, digit → number, \`t\` → \`true\` hona chahiye... Agar kuch bhi rules ke against mila (single quote, trailing comma, bina quote ki key), turant **error**: "Unexpected token".

Type mapping yaad rakho: JSON \`true\` ↔ Python \`True\`, \`null\` ↔ \`None\`, object ↔ dict. JSON mein **date ka type nahi hai** — dates string ban ke jaati hain (\`"2026-10-06T10:30:00Z"\`).`,
          en: `There are two main JSON operations:

1. **Serialize (object → text)**: turn an in-memory object into a JSON string so it can be sent or saved.
   - JS: \`JSON.stringify(obj)\`
   - Python: \`json.dumps(obj)\`
2. **Parse / deserialize (text → object)**: turn received text back into an object so you can use \`data.name\`.
   - JS: \`JSON.parse(text)\` (and \`await response.json()\` with fetch)
   - Python: \`json.loads(text)\`

The parser reads the text **character by character**: \`{\` starts an object, \`"\` a string, a digit a number, \`t\` must be \`true\`... Anything against the rules (single quotes, a trailing comma, an unquoted key) causes an immediate **error**: "Unexpected token".

Type mapping: JSON \`true\` ↔ Python \`True\`, \`null\` ↔ \`None\`, object ↔ dict. JSON has **no date type** — dates travel as strings like \`"2026-10-06T10:30:00Z"\`.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Ye program JSON ka poora round trip dikhata hai:

1. \`text\` ek JSON **string** hai — jaise API se aata hai.
2. \`JSON.parse\` / \`json.loads\` use object/dict mein badalta hai. Ab \`student.name\` / \`student["name"]\` se values nikal sakte ho.
3. \`typeof\` / \`type().__name__\` dikhata hai ki \`age\` asli number ban gaya, string nahi.
4. Object ko badalte hain (\`skills\` mein "react" add) aur \`JSON.stringify\` / \`json.dumps\` se wapas text banate hain — dhyaan do \`false\` aur \`null\` JSON form mein wapas aa gaye.
5. \`indent\` / \`null, 2\` se **pretty print** — config files aur debugging ke liye.
6. Last mein invalid JSON (single quotes, bina quote ki key) parse karte hain — error ko \`try/catch\` / \`try/except\` se pakadte hain.`,
          en: `This program shows a full JSON round trip:

1. \`text\` is a JSON **string** — like what an API sends.
2. \`JSON.parse\` / \`json.loads\` turns it into an object/dict. Now you can read \`student.name\` / \`student["name"]\`.
3. \`typeof\` / \`type().__name__\` shows that \`age\` became a real number, not a string.
4. We change the object (add "react" to \`skills\`) and turn it back into text with \`JSON.stringify\` / \`json.dumps\` — note that \`false\` and \`null\` come back in JSON form.
5. \`indent\` / \`null, 2\` **pretty-prints** — useful for config files and debugging.
6. Finally we parse invalid JSON (single quotes, unquoted key) and catch the error with \`try/catch\` / \`try/except\`.`,
        },
        codeJs: `const text = '{"name":"Priya","age":21,"skills":["python","sql"],"placed":false,"offer":null}';

const student = JSON.parse(text); // text -> object
console.log("name:", student.name);
console.log("first skill:", student.skills[0]);
console.log("type of age:", typeof student.age);
console.log("offer is null?", student.offer === null);

student.skills.push("react");
const back = JSON.stringify(student); // object -> text
console.log("as text:", back);

console.log("pretty:");
console.log(JSON.stringify({ city: "Pune", pin: 411001 }, null, 2));

try {
  JSON.parse("{name: 'Priya'}");
} catch (err) {
  console.log("Invalid JSON! Keys and strings need double quotes.");
}
`,
        codePython: `import json

text = '{"name":"Priya","age":21,"skills":["python","sql"],"placed":false,"offer":null}'

student = json.loads(text)  # text -> dict
print("name:", student["name"])
print("first skill:", student["skills"][0])
print("type of age:", type(student["age"]).__name__)
print("offer is None?", student["offer"] is None)

student["skills"].append("react")
back = json.dumps(student)  # dict -> text
print("as text:", back)

print("pretty:")
print(json.dumps({"city": "Pune", "pin": 411001}, indent=2))

try:
    json.loads("{name: 'Priya'}")
except json.JSONDecodeError:
    print("Invalid JSON! Keys and strings need double quotes.")
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `JSON likhte waqt sabse common galtiyan:

- **Single quotes**: \`{'name': 'Ravi'}\` — invalid! JSON mein sirf **double quotes**.
- **Keys bina quotes ke**: \`{name: "Ravi"}\` — JS object mein chalta hai, JSON mein nahi.
- **Trailing comma**: \`{"a": 1, "b": 2,}\` — last comma ki wajah se parse fail.
- **Comments**: \`// ye price hai\` — JSON comments allow nahi karta.
- **String aur object mix karna**: API se aaya data abhi bhi **string** hai aur tum \`data.name\` kar rahe ho → \`undefined\`. Pehle parse karo.
- **Number ko string mein bhejna**: \`"price": "499"\` — phir \`price + 10\` = \`"49910"\`! Types sahi rakho.
- **Python ka \`str(dict)\` ko JSON samajhna**: \`str({"a": True})\` deta hai \`{'a': True}\` — ye JSON nahi hai. Hamesha \`json.dumps\` use karo.
- **\`undefined\`, \`NaN\`, functions** — JSON mein exist hi nahi karte; \`stringify\` inhe chupchaap hata ya badal deta hai.`,
          en: `The most common JSON mistakes:

- **Single quotes**: \`{'name': 'Ravi'}\` is invalid. JSON uses only **double quotes**.
- **Unquoted keys**: \`{name: "Ravi"}\` works in a JS object, not in JSON.
- **Trailing comma**: \`{"a": 1, "b": 2,}\` fails because of the last comma.
- **Comments**: \`// this is the price\` — JSON does not allow comments.
- **Mixing up strings and objects**: the API data is still a **string** and you call \`data.name\` → \`undefined\`. Parse first.
- **Sending numbers as strings**: \`"price": "499"\` — then \`price + 10\` = \`"49910"\`! Keep types correct.
- **Treating Python's \`str(dict)\` as JSON**: \`str({"a": True})\` gives \`{'a': True}\`, which is not JSON. Always use \`json.dumps\`.
- **\`undefined\`, \`NaN\`, functions** do not exist in JSON; \`stringify\` silently drops or changes them.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `JSON se related errors aur unka ilaaj:

1. **\`Unexpected token ' in JSON at position 1\`** / \`JSONDecodeError: Expecting property name\` → quotes ya comma ki galti. Position number dekho, wahi character galat hai. **jsonlint.com** ya VS Code mein paste karo — wo exact line highlight karega.
2. **\`Unexpected token < in JSON at position 0\`** → classic! Tumne JSON expect kiya par server ne **HTML** bheja (\`<!DOCTYPE html>\` — shayad 404 page ya error page). URL aur status code check karo.
3. **\`Unexpected end of JSON input\`** → body khaali hai ya beech mein kat gaya. Network tab mein response dekho.
4. **\`undefined\` mil raha hai** → \`console.log(typeof data)\` karo. \`"string"\` aaya toh parse karna bhool gaye. Phir key ka naam aur nesting check karo (\`data.user.name\` vs \`data.name\`).
5. Bada nested JSON samajhna ho toh \`JSON.stringify(data, null, 2)\` / \`json.dumps(data, indent=2)\` se pretty print karo.`,
          en: `JSON errors and how to fix them:

1. **\`Unexpected token ' in JSON at position 1\`** / \`JSONDecodeError: Expecting property name\` → a quote or comma mistake. The position number points at the bad character. Paste into **jsonlint.com** or VS Code to see the exact line.
2. **\`Unexpected token < in JSON at position 0\`** → a classic! You expected JSON but the server sent **HTML** (\`<!DOCTYPE html>\` — maybe a 404 or error page). Check the URL and status code.
3. **\`Unexpected end of JSON input\`** → the body is empty or cut off. Check the response in the Network tab.
4. **Getting \`undefined\`** → run \`console.log(typeof data)\`. If it says \`"string"\`, you forgot to parse. Then check key names and nesting (\`data.user.name\` vs \`data.name\`).
5. To read a big nested JSON, pretty-print it with \`JSON.stringify(data, null, 2)\` / \`json.dumps(data, indent=2)\`.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `JSON default choice hai, par limits hain:

- **Size aur speed**: JSON text hai, har baar keys repeat hoti hain (\`"name"\`, \`"name"\`...). Bahut high traffic ya microservices ke beech **Protobuf** / **MessagePack** jaise binary formats chhote aur fast hote hain — par insaan padh nahi sakta.
- **Types kam hain**: date, bade integers (JS mein 2^53 se upar precision kho jaata hai), binary data — inke liye conventions chahiye (date ko ISO string, badi ID ko string).
- **Comments nahi**: config files ke liye **YAML** (Docker Compose, GitHub Actions) ya **TOML** (\`pyproject.toml\`) zyada friendly hain.
- **Tabular data**: Excel jaisa simple table ho toh **CSV** chhota aur easy hai.
- **Schema nahi**: JSON khud nahi batata ki kaunsi field zaroori hai. Iske liye **JSON Schema**, Zod (JS) ya Pydantic (Python) se validate karte hain.

Web APIs aur config ke liye JSON hi start karo; zaroorat pade tabhi switch karo.`,
          en: `JSON is the default choice, but it has limits:

- **Size and speed**: JSON is text and repeats keys (\`"name"\`, \`"name"\`...). For very high traffic or between microservices, binary formats like **Protobuf** / **MessagePack** are smaller and faster — but not human-readable.
- **Few types**: dates, big integers (JS loses precision above 2^53) and binary data need conventions (ISO strings for dates, strings for big IDs).
- **No comments**: for config, **YAML** (Docker Compose, GitHub Actions) or **TOML** (\`pyproject.toml\`) are friendlier.
- **Tabular data**: a simple table is smaller and easier as **CSV**.
- **No schema**: JSON does not say which fields are required. Validate with **JSON Schema**, Zod (JS) or Pydantic (Python).

Start with JSON for web APIs and config; switch only when you need to.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Tum ek **weather + news dashboard** bana rahe ho jo ek public API se data laata hai:

\`\`\`
const res = await fetch("/api/weather?city=Pune");
const data = await res.json();
console.log(data.current.temp, data.forecast[0].day);
\`\`\`

- Response nested hai: \`current\` ek object, \`forecast\` objects ka array. Tumhe exact path pata hona chahiye.
- Ek din API ne field ka naam \`temp\` se \`temperature\` kar diya → UI mein \`undefined\`. Isliye teams response ko **validate** karti hain (Zod/Pydantic) aur clear error dikhati hain.
- Backend (Express) mein \`app.use(express.json())\` lagana padta hai taaki POST body JSON se object ban sake; Flask mein \`request.get_json()\`.
- User settings (theme, city) ko \`localStorage\` mein JSON string bana ke save karte ho.
- Debugging ke liye kabhi kabhi poore response mein **kitni keys** hain gin'na padta hai — yahi is topic ka build task \`countKeys\` hai.`,
          en: `You are building a **weather + news dashboard** that fetches data from a public API:

\`\`\`
const res = await fetch("/api/weather?city=Pune");
const data = await res.json();
console.log(data.current.temp, data.forecast[0].day);
\`\`\`

- The response is nested: \`current\` is an object, \`forecast\` is an array of objects. You must know the exact path.
- One day the API renames \`temp\` to \`temperature\` → \`undefined\` in the UI. That is why teams **validate** responses (Zod/Pydantic) and show clear errors.
- In an Express backend you add \`app.use(express.json())\` so POST bodies become objects; in Flask, \`request.get_json()\`.
- User settings (theme, city) are saved in \`localStorage\` as a JSON string.
- When debugging, you sometimes count **how many keys** a response has — that is this topic's build task, \`countKeys\`.`,
        },
      },
    ],
    visualization: {
      kind: "FLOW",
      title: "Server ke object se client ke object tak",
      steps: [
        { title: "Server memory mein object", description: "Python dict ya JS object: {name: 'Priya', age: 21}. Ye sirf server ki RAM mein hai.", highlight: "object" },
        { title: "Serialize", description: "JSON.stringify / json.dumps object ko text banata hai: {\"name\":\"Priya\",\"age\":21}.", highlight: "stringify" },
        { title: "Network pe text", description: "Ye JSON text HTTP response ki body mein, Content-Type: application/json ke saath bytes ban ke jaata hai.", highlight: "body" },
        { title: "Parse", description: "Client JSON.parse / response.json() / json.loads se text ko wapas object banata hai. Galat JSON ho toh yahin error.", highlight: "parse" },
        { title: "Use karo", description: "Ab data.name, data.age normal object ki tarah use hote hain — UI mein dikhane ke liye ready.", highlight: "data.name" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which of these is valid JSON?",
        options: ['{"name": "Ravi"}', "{name: 'Ravi'}", "{'name': 'Ravi'}", '{"name": "Ravi",}'],
        correct: [0],
        explanation: "JSON mein key aur string dono double quotes mein, aur trailing comma nahi. Sirf pehla option sahi hai.",
        tags: ["syntax"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does JSON.parse() do in JavaScript?",
        options: [
          "Converts a JSON string into a JavaScript object",
          "Converts a JavaScript object into a JSON string",
          "Sends JSON to a server",
          "Checks if a file exists",
        ],
        correct: [0],
        explanation: "parse = text → object. Ulta kaam (object → text) JSON.stringify karta hai.",
        tags: ["parse"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Which of these is NOT a JSON data type?",
        options: ["string", "boolean", "null", "Date"],
        correct: [3],
        explanation: "JSON ke types: string, number, boolean, null, object, array. Date ka type nahi hai — dates string ban ke jaati hain, jaise \"2026-10-06\".",
        tags: ["types"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these are valid JSON texts on their own?",
        options: ['"hello"', "42", "[1, 2, 3]", "{'a': 1}"],
        correct: [0, 1, 2],
        explanation: "Koi bhi JSON value akeli valid JSON hai — string, number, array sab. {'a': 1} mein single quotes hain, isliye invalid.",
        tags: ["syntax"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this code print?",
        code: `const data = JSON.parse('{"items":[10,20,30],"count":"3"}');
console.log(data.items.length + data.count);`,
        codeLanguage: "javascript",
        options: ["33", "6", "3", "It throws an error"],
        correct: [0],
        explanation: "items.length = 3 (number), par count \"3\" string hai kyunki JSON mein quotes mein tha. 3 + \"3\" = \"33\" (string jod di). JSON mein types sahi rakhna kitna zaroori hai!",
        tags: ["types", "code"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "An API returns {\"price\": \"499\"}. Your code adds a ₹10 delivery fee and shows ₹49910. What is the best fix?",
        options: [
          "Convert the price to a number (Number() / int()) before adding, and ideally make the API send a number",
          "Add the fee twice",
          "Use single quotes in the JSON",
          "Call JSON.stringify on the price",
        ],
        correct: [0],
        explanation: "\"499\" string hai, + string jodta hai. Number mein convert karo — aur long-term fix: API ko number bhejna chahiye, string nahi.",
        tags: ["types"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Put the steps in order for sending data from a server to a client as JSON.",
        options: [
          "The server has the data as an object or dict in memory",
          "It serializes the data with JSON.stringify or json.dumps",
          "The JSON text travels in the HTTP response body",
          "The client parses it with JSON.parse, response.json() or json.loads",
          "The client uses it as a normal object",
        ],
        explanation: "Object → serialize (text) → network → parse (object) → use. Network pe hamesha text hi jaata hai.",
        tags: ["flow"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why is JSON so popular for web APIs?",
        keywords: ["text", "language independent", "human readable", "lightweight", "key value"],
        explanation: "JSON simple text hai, insaan padh sakta hai, XML se halka hai, aur har language mein built-in support hai. Key-value structure seedha objects/dicts pe map hota hai.",
        tags: ["concepts"],
      },
    ],
    buildTask: {
      title: "Count all keys in a JSON string",
      description: `Function **\`countKeys(jsonString)\`** likho jo ek JSON **string** le aur usme **saare objects ki total keys** gine — nested objects aur arrays ke andar wale objects bhi.

- \`'{"a":1,"b":2}'\` → \`2\`
- \`'{"user":{"name":"Ravi","age":20}}'\` → \`3\` (user, name, age)
- \`'[{"id":1},{"id":2}]'\` → \`2\`
- Valid JSON jisme koi object nahi (jaise \`'42'\`) → \`0\`
- **Invalid JSON** → \`-1\``,
      functionName: "countKeys",
      starterJs: `function countKeys(jsonString) {
  // TODO: parse safely, then walk objects and arrays recursively
}
`,
      starterPython: `def countKeys(jsonString):
    # TODO: parse safely, then walk dicts and lists recursively
    pass
`,
      tests: [
        { name: "flat object", args: ['{"a":1,"b":2}'], expected: 2 },
        { name: "empty object", args: ["{}"], expected: 0 },
        { name: "nested object", args: ['{"user":{"name":"Ravi","age":20}}'], expected: 3 },
        { name: "array of objects", args: ['[{"id":1},{"id":2,"tags":["x"]}]'], expected: 3 },
        { name: "no objects at all", args: ["42"], expected: 0 },
        { name: "invalid JSON", args: ["{name: \"Ravi\"}"], expected: -1, hidden: true },
        { name: "deep nesting with null", args: ['{"a":[{"b":{"c":1}}],"d":null}'], expected: 4, hidden: true },
      ],
      hints: [
        "Do kaam hain: (1) string ko safely parse karna — error aaye toh -1; (2) parsed value ko recursively ghoomna: object mein har key +1 aur uski value ke andar bhi dekho, array mein har item ke andar dekho.",
        "Ek helper walk(value) banao: array hai → items ka walk ka sum; object hai (null nahi!) → har key ke liye 1 + walk(value); warna 0. Parse ko try/catch (JS) ya try/except (Python) mein rakho.",
        "JS: if (Array.isArray(v)) return v.reduce((s, x) => s + walk(x), 0); if (v !== null && typeof v === 'object') return Object.keys(v).reduce((s, k) => s + 1 + walk(v[k]), 0); return 0;",
      ],
      explainQuestions: [
        { question: "Why did you use recursion to count the keys?", keywords: ["nested", "recursion", "unknown depth", "itself"] },
        { question: "Why do you need to check for null separately in JavaScript?", keywords: ["typeof null", "object", "null", "crash"] },
        { question: "How does your function detect invalid JSON?", keywords: ["try", "catch", "parse error", "-1"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "What is JSON and how is it different from a JavaScript object?",
        short: "JSON is a text format for exchanging data, with strict rules: keys and strings in double quotes, and only strings, numbers, booleans, null, objects and arrays. A JavaScript object is a live in-memory structure that can hold functions, undefined, dates and unquoted keys. You convert between them with JSON.stringify and JSON.parse.",
        deep: `- **JSON**: a string. Language-independent (RFC 8259). No comments, no trailing commas, no undefined/NaN/functions.
- **JS object**: lives in memory, supports methods, symbols, Dates, prototypes.
- \`JSON.stringify\` drops functions and undefined, turns NaN into null and Dates into ISO strings.
- \`JSON.parse(text, reviver)\` can convert values back (e.g. ISO strings into Dates).`,
        followUps: ["What does JSON.stringify do with undefined values?", "How would you send a date in JSON?", "What is a reviver function?"],
        commonMistake: "Saying JSON is just a JavaScript object, or that it supports comments.",
        keywords: ["text format", "double quotes", "stringify", "parse"],
        difficulty: 1,
        roles: ["FRONTEND", "BACKEND", "FULLSTACK", "SDE"],
      },
      {
        question: "Why would 'Unexpected token < in JSON at position 0' happen and how do you fix it?",
        short: "It means the code tried to parse a response as JSON, but the body started with a '<' — usually an HTML page like a 404, an error page or the frontend's index.html. I would check the request URL, the status code and the raw response in the Network tab, and fix the wrong endpoint or the server error before parsing.",
        deep: `- Common causes: wrong API base URL, missing proxy in dev, the server's 404/500 HTML page, an auth redirect to a login page.
- Defensive client code:
  - check \`response.ok\` before \`response.json()\`
  - check the \`Content-Type\` header includes \`application/json\`
- Server side: return JSON errors from API routes, not HTML.`,
        followUps: ["How would you make your fetch wrapper handle non-JSON errors?", "Why might a dev proxy cause this?"],
        commonMistake: "Trying to fix the JSON parser instead of checking what the server actually returned.",
        keywords: ["html", "status code", "content-type", "network tab"],
        difficulty: 2,
        roles: ["FRONTEND", "FULLSTACK", "BACKEND"],
      },
    ],
    promptCard: {
      title: "Generate realistic sample JSON and a validator",
      category: "TESTING",
      task: "Create realistic sample JSON data for an API, plus edge cases and validation code, so you can test your frontend or backend.",
      whenToUse: "When you are building an API or UI before the real backend exists, or want test data that covers edge cases.",
      template: `I am building [FEATURE_DESCRIPTION].

Here is the shape of one record (fields and types):
[FIELD_LIST]

Please:
1. Generate [RECORD_COUNT] realistic sample records as a valid JSON array (Indian names, cities and prices are fine).
2. Add 3 edge-case records (empty strings, missing optional fields, very large numbers) and label which is which.
3. Write a [LANGUAGE] function that validates one record and returns a list of error messages.
4. Point out any field where the type could cause bugs (for example numbers sent as strings).
Output valid JSON only inside code blocks, with double quotes and no comments.`,
      variables: [
        { key: "FEATURE_DESCRIPTION", label: "What you are building (e.g. a food menu API)" },
        { key: "FIELD_LIST", label: "Fields with types, e.g. name: string, price: number, veg: boolean" },
        { key: "RECORD_COUNT", label: "How many normal records you want (e.g. 5)" },
        { key: "LANGUAGE", label: "JavaScript or Python" },
      ],
      whyItWorks: [
        { part: "Explicit field types", why: "The AI generates data with correct types instead of guessing, which avoids '499' vs 499 bugs." },
        { part: "Edge-case records", why: "Real bugs hide in empty, missing and huge values; asking for them makes your tests stronger." },
        { part: "Validator function", why: "You get code that checks data at runtime, not just sample data." },
        { part: "Valid JSON only, no comments", why: "Prevents the AI from producing JS-style objects that fail JSON.parse." },
      ],
      verifyChecklist: [
        "Paste the generated JSON into JSON.parse or json.loads and confirm it parses",
        "Check every field has the type you asked for",
        "Run the validator on the edge cases and confirm it reports errors",
        "Make sure no real personal data (real phone numbers, emails) is in the samples",
      ],
      sampleOutput: `\`\`\`json
[
  {"id": 1, "name": "Paneer Tikka Roll", "price": 149, "veg": true, "city": "Pune"},
  {"id": 2, "name": "Chicken Biryani", "price": 279, "veg": false, "city": "Hyderabad"}
]
\`\`\`

**Edge cases:** an empty name, a missing city, price 99999999.

**Risky field:** \`price\` must be a number; if the API ever sends "149" as a string, adding a delivery fee will concatenate.`,
    },
  },
];
