import type { SeedTopicContent } from "./types.js";

export const topics: SeedTopicContent[] = [
  // ───────────────────────────── 1. HTTP methods and status codes ─────────────────────────────
  {
    slug: "http-methods-status",
    estMinutes: 35,
    difficulty: 1,
    prerequisites: ["http-request-response", "what-is-an-api"],
    objectives: [
      "Choose the right HTTP method (GET, POST, PUT, PATCH, DELETE) for an action",
      "Return the correct status code family (2xx, 3xx, 4xx, 5xx) from an API",
      "Explain safe vs idempotent methods and why retries depend on it",
      "Tell 400, 401, 403, 404, 409 and 500 apart while debugging",
    ],
    technicalDefinition:
      "HTTP methods are verbs that state the intended action on a resource (GET reads, POST creates, PUT replaces, PATCH partially updates, DELETE removes), and status codes are three-digit numbers in the response that report the outcome, grouped as 1xx informational, 2xx success, 3xx redirection, 4xx client error and 5xx server error.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `Har HTTP request do cheezein bolti hai: **kya karna hai** (method) aur **kis cheez pe** (URL/path). Response wapas aata hai ek **status code** ke saath jo batata hai kaam hua ya nahi.

- **Method** = verb: \`GET\` (padho), \`POST\` (naya banao), \`PUT\` (poora replace karo), \`PATCH\` (thoda sa badlo), \`DELETE\` (hata do).
- **Status code** = result ka number: \`2xx\` sab theek, \`3xx\` kahin aur jao, \`4xx\` galti client ki, \`5xx\` galti server ki.

Jaise \`GET /orders/42\` ka matlab hai "order 42 dikhao", aur \`404\` ka matlab hai "bhai, ye order mila hi nahi". Bas itna samajh lo — method sawaal hai, status code jawab ka mood hai.`,
          en: `Every HTTP request says two things: **what to do** (the method) and **on which thing** (the URL path). The response comes back with a **status code** that tells whether it worked.

- **Method** is the verb: \`GET\` reads, \`POST\` creates, \`PUT\` replaces, \`PATCH\` partly updates, \`DELETE\` removes.
- **Status code** is the result: \`2xx\` success, \`3xx\` go somewhere else, \`4xx\` the client made a mistake, \`5xx\` the server failed.

So \`GET /orders/42\` means "show order 42", and \`404\` means "that order does not exist".`,
          hi: `हर HTTP request दो बातें बताती है: **क्या करना है** (method) और **किस चीज़ पर** (URL)। जवाब में एक **status code** आता है जो बताता है कि काम हुआ या नहीं।

- **Method** एक क्रिया है: \`GET\` पढ़ो, \`POST\` नया बनाओ, \`PUT\` पूरा बदलो, \`PATCH\` थोड़ा बदलो, \`DELETE\` हटाओ।
- **Status code** नतीजे का नंबर है: \`2xx\` सफल, \`3xx\` कहीं और जाओ, \`4xx\` गलती client की, \`5xx\` गलती server की।

जैसे \`GET /orders/42\` का मतलब है "order 42 दिखाओ", और \`404\` का मतलब है "यह order मिला ही नहीं"।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `Socho tum **IRCTC counter** pe khade ho. Tum clerk ko form dete ho — form pe likha hai "naya ticket book karo" (POST), "mera PNR status batao" (GET), "ticket cancel karo" (DELETE), ya "sirf berth preference badlo" (PATCH).

Clerk ka jawab bhi fixed type ka hota hai:
- "Ho gaya, ye raha ticket" → **201 Created**
- "Form adhoora hai, train number likho" → **400 Bad Request**
- "Pehle ID dikhao" → **401 Unauthorized**
- "Ye ticket aapka nahi hai, cancel nahi kar sakte" → **403 Forbidden**
- "Is PNR ka koi record nahi" → **404 Not Found**
- "Server down hai, baad mein aao" → **500/503**

Form ka type = method. Clerk ka jawab = status code. Dono standard hain, isliye har passenger samajh jaata hai.`,
          en: `Imagine you are at a **railway booking counter**. You hand the clerk a form that says "book a new ticket" (POST), "tell me my PNR status" (GET), "cancel my ticket" (DELETE) or "only change my berth preference" (PATCH).

The clerk's replies are also standard:
- "Done, here is your ticket" is **201 Created**
- "Your form is incomplete" is **400 Bad Request**
- "Show your ID first" is **401 Unauthorized**
- "This is not your ticket" is **403 Forbidden**
- "No such PNR" is **404 Not Found**
- "System is down" is **500/503**

The form type is the method; the clerk's reply is the status code.`,
          hi: `सोचिए आप **रेलवे टिकट काउंटर** पर खड़े हैं। आप क्लर्क को फ़ॉर्म देते हैं जिस पर लिखा है "नया टिकट बुक करो" (POST), "मेरा PNR स्टेटस बताओ" (GET), "टिकट कैंसल करो" (DELETE), या "सिर्फ़ बर्थ बदलो" (PATCH)।

क्लर्क के जवाब भी तय होते हैं:
- "हो गया, यह रहा टिकट" → **201 Created**
- "फ़ॉर्म अधूरा है" → **400 Bad Request**
- "पहले पहचान पत्र दिखाओ" → **401 Unauthorized**
- "यह टिकट आपका नहीं है" → **403 Forbidden**
- "ऐसा कोई PNR नहीं" → **404 Not Found**

फ़ॉर्म का प्रकार = method, क्लर्क का जवाब = status code।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Agar methods aur status codes na hote, to har API apni alag bhasha bolti. Ek API error pe \`{"ok": false}\` bhejti, doosri \`{"status": "fail"}\`, teesri 200 ke saath "error" string. Frontend, mobile app, monitoring tools — sab confuse.

Standard hone ke fayde:
- **Browser aur CDN** jaante hain ki \`GET\` safe hai, isliye use cache kar sakte hain.
- **Retry logic** jaanta hai ki \`PUT\`/\`DELETE\` dobara bhejna safe hai (idempotent), par \`POST\` dobara bhejne se do order ban sakte hain.
- **Monitoring** (Grafana, Datadog) seedha 5xx count karke alert bhej deta hai — "server ki galti badh gayi".
- **Frontend** status dekh ke decide karta hai: 401 aaya to login page, 404 aaya to "not found" screen.

Ek common language = kam bugs, fast debugging.`,
          en: `Without standard methods and status codes, every API would invent its own language. One API would send \`{"ok": false}\`, another would send 200 with an "error" string. Clients and tools would be confused.

Because they are standard:
- **Browsers and CDNs** know \`GET\` is safe, so they can cache it.
- **Retry logic** knows \`PUT\` and \`DELETE\` are idempotent, but repeating \`POST\` may create duplicates.
- **Monitoring tools** count 5xx responses and alert the team.
- **Frontends** react to status: 401 means show login, 404 means show a not-found screen.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Real products mein ye har jagah dikhta hai:

- **Zomato/Swiggy jaisa food app**: menu dekhna \`GET /restaurants/:id/menu\`, order place karna \`POST /orders\` (jawab \`201\`), order cancel karna \`DELETE\` ya \`POST /orders/:id/cancel\`. Restaurant band ho to API \`409 Conflict\` ya \`422\` jaisa clear error deti hai taaki app sahi message dikhaye.
- **GitHub REST API**: publicly documented hai — repo banana \`POST /user/repos\` → \`201\`, galat token → \`401\`, rate limit khatam → \`403\`/\`429\` with headers, repo nahi mila → \`404\`.
- **Stripe/Razorpay jaisi payment APIs**: \`POST\` requests ke saath **idempotency key** lete hain, kyunki network retry pe payment do baar nahi katna chahiye.

Har jagah pattern same: sahi verb, sahi status.`,
          en: `You see this everywhere:

- **A food-delivery app like Zomato**: viewing a menu is \`GET /restaurants/:id/menu\`, placing an order is \`POST /orders\` returning \`201\`. If the restaurant is closed, the API returns a clear 4xx so the app can show the right message.
- **GitHub's REST API** documents its codes: creating a repo returns \`201\`, a bad token returns \`401\`, a missing repo returns \`404\`.
- **Payment APIs like Stripe and Razorpay** accept an **idempotency key** on \`POST\` so a network retry does not charge twice.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Andar kya hota hai, step by step:

1. Client text bhejta hai: pehli line \`POST /orders HTTP/1.1\` — isme method aur path dono hain.
2. Server ka router **method + path** dono match karta hai. \`GET /orders\` aur \`POST /orders\` alag handlers hain.
3. Handler kaam karta hai aur ek **status line** banata hai: \`HTTP/1.1 201 Created\`.
4. Client pehle status padhta hai, phir body.

Do important properties:
- **Safe**: server ka data nahi badalta (\`GET\`, \`HEAD\`, \`OPTIONS\`).
- **Idempotent**: ek baar bhejo ya das baar, final result same (\`GET\`, \`PUT\`, \`DELETE\`). \`POST\` idempotent nahi hai, \`PATCH\` generally nahi maana jaata.

Status code ka **pehla digit** hi category batata hai — isliye client ko har code yaad rakhne ki zaroorat nahi, \`4xx\` dekha to samjho "meri request mein gadbad".`,
          en: `Step by step:

1. The client sends a first line like \`POST /orders HTTP/1.1\` containing method and path.
2. The server router matches **method + path** together; \`GET /orders\` and \`POST /orders\` are different handlers.
3. The handler does the work and writes a status line like \`HTTP/1.1 201 Created\`.
4. The client reads the status first, then the body.

Two properties matter: **safe** methods do not change data (\`GET\`, \`HEAD\`), and **idempotent** methods give the same final result when repeated (\`GET\`, \`PUT\`, \`DELETE\`). \`POST\` is not idempotent. The first digit of a status code gives its category.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yahan ek chhota sa **fake router** hai — koi server nahi chal raha, bas function jo method + path dekh ke status deta hai.

- \`users\` object hamara mini database hai.
- \`handle(method, path, body)\` path ko \`split("/")\` karke resource aur id nikalta hai.
- \`GET\` with id → user mila to \`200\`, nahi mila to \`404\`.
- \`POST\` without id → \`name\` missing to \`400\`, warna naya user banake \`201\`.
- \`DELETE\` → \`204 No Content\` (body khaali).
- Koi aur combination → \`405 Method Not Allowed\`.

Real Express mein yahi hota hai:

\`\`\`js
app.post("/users", (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: "name is required" });
  res.status(201).json(createUser(req.body));
});
\`\`\`

Output dekho — har call ka status alag hai aur har ek ka reason clear hai.`,
          en: `This is a tiny **fake router**: no server runs, just a function that picks a status from method + path.

- \`users\` is our mini database.
- \`handle\` splits the path to get the resource and id.
- \`GET\` with an id returns \`200\` or \`404\`.
- \`POST\` returns \`400\` if \`name\` is missing, otherwise \`201\`.
- \`DELETE\` returns \`204 No Content\`.
- Anything else returns \`405 Method Not Allowed\`.

In real Express you write \`res.status(201).json(...)\` in the same way. Read the output and match each status to its reason.`,
        },
        codeJs: `const users = { "1": { id: "1", name: "Asha" } };

function handle(method, path, body) {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "users") return { status: 404, body: { error: "Not found" } };
  const id = parts[1];
  if (method === "GET" && id) {
    if (!users[id]) return { status: 404, body: { error: "User not found" } };
    return { status: 200, body: users[id] };
  }
  if (method === "POST" && !id) {
    if (!body || !body.name) return { status: 400, body: { error: "name is required" } };
    const newId = String(Object.keys(users).length + 1);
    users[newId] = { id: newId, name: body.name };
    return { status: 201, body: users[newId] };
  }
  if (method === "DELETE" && id) {
    if (!users[id]) return { status: 404, body: { error: "User not found" } };
    delete users[id];
    return { status: 204, body: null };
  }
  return { status: 405, body: { error: "Method not allowed" } };
}

const calls = [
  ["GET", "/users/1"],
  ["GET", "/users/9"],
  ["POST", "/users", { name: "Ravi" }],
  ["POST", "/users", {}],
  ["DELETE", "/users/1"],
  ["PATCH", "/users/2"],
];
for (const [method, path, body] of calls) {
  const res = handle(method, path, body);
  console.log(method + " " + path + " -> " + res.status + " " + JSON.stringify(res.body));
}
`,
        codePython: `import json

users = {"1": {"id": "1", "name": "Asha"}}


def handle(method, path, body=None):
    parts = [p for p in path.split("/") if p]
    if not parts or parts[0] != "users":
        return 404, {"error": "Not found"}
    user_id = parts[1] if len(parts) > 1 else None
    if method == "GET" and user_id:
        if user_id not in users:
            return 404, {"error": "User not found"}
        return 200, users[user_id]
    if method == "POST" and not user_id:
        if not body or not body.get("name"):
            return 400, {"error": "name is required"}
        new_id = str(len(users) + 1)
        users[new_id] = {"id": new_id, "name": body["name"]}
        return 201, users[new_id]
    if method == "DELETE" and user_id:
        if user_id not in users:
            return 404, {"error": "User not found"}
        del users[user_id]
        return 204, None
    return 405, {"error": "Method not allowed"}


calls = [
    ("GET", "/users/1", None),
    ("GET", "/users/9", None),
    ("POST", "/users", {"name": "Ravi"}),
    ("POST", "/users", {}),
    ("DELETE", "/users/1", None),
    ("PATCH", "/users/2", None),
]
for method, path, body in calls:
    status, res_body = handle(method, path, body)
    print(f"{method} {path} -> {status} {json.dumps(res_body)}")
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Beginners ye galtiyan bahut karte hain:

- **Har cheez pe 200**: error ho tab bhi \`200\` + \`{"error": "..."}\`. Isse monitoring ko pata hi nahi chalta ki kuch fail hua. Error ho to 4xx/5xx bhejo.
- **GET se data badalna**: \`GET /deleteUser?id=5\` — crawler ya browser prefetch ne link khola aur user delete! GET hamesha safe hona chahiye.
- **401 aur 403 mix karna**: 401 = "tum kaun ho, pata nahi" (login nahi). 403 = "pata hai tum kaun ho, par permission nahi".
- **Validation fail pe 500**: user ne galat email bheja, ye uski galti hai → \`400\`/\`422\`, server crash wala 500 nahi.
- **POST ke baad 200**: naya resource bana hai to \`201 Created\` zyada sahi hai.
- **Stack trace response mein bhejna** jab 500 aaye — ye security leak hai.`,
          en: `Common beginner mistakes:

- **200 for everything**, even errors, so monitoring never sees failures.
- **Changing data with GET**, like \`GET /deleteUser?id=5\`; a crawler or prefetch can trigger it.
- **Mixing 401 and 403**: 401 means not authenticated, 403 means authenticated but not allowed.
- **Returning 500 for bad input**: invalid input is a client error, so use \`400\` or \`422\`.
- **Returning 200 after creating** instead of \`201 Created\`.
- **Sending stack traces** in 500 responses, which leaks internals.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Status code khud hi aadha debugging kar deta hai:

1. **Browser DevTools → Network tab** kholo. Request pe click karo — method, URL, status, request body aur response body sab dikh jayega.
2. **4xx dikha?** Pehle apni request check karo: sahi URL? sahi method (\`POST\` ki jagah \`GET\` to nahi bhej diya)? \`Content-Type: application/json\` header hai? Token bheja?
3. **405** aaya → route exist karta hai par us method ke liye nahi.
4. **5xx dikha?** Server logs dekho. Response mein detail nahi milegi (milni bhi nahi chahiye), logs mein stack trace hoga.
5. **curl se reproduce karo**:

\`\`\`bash
curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Ravi"}'
\`\`\`

\`-i\` flag status line aur headers dikhata hai. Frontend hata ke seedha API test karna sabse fast tareeka hai.`,
          en: `The status code does half the debugging:

1. Open **DevTools, Network tab** and inspect method, URL, status and both bodies.
2. For **4xx**, check your request: correct URL, correct method, \`Content-Type\` header, auth token.
3. **405** means the route exists but not for that method.
4. For **5xx**, read the server logs; the stack trace is there, not in the response.
5. Reproduce with \`curl -i\`, which prints the status line and headers, so you can test the API without the frontend.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Kuch jagah strict REST methods fit nahi hote:

- **Actions jo CRUD nahi hain**: "order cancel karo", "OTP resend karo". Kuch teams \`POST /orders/42/cancel\` likhti hain — ye pragmatic hai aur theek hai, bas consistent raho.
- **GraphQL**: almost sab kuch \`POST /graphql\` pe jaata hai aur errors aksar \`200\` ke andar \`errors\` array mein aate hain. Isme HTTP status ka power kam use hota hai; monitoring ko body padhni padti hai.
- **gRPC** apne alag status codes use karta hai (\`NOT_FOUND\`, \`PERMISSION_DENIED\`).
- **Bahut zyada specific codes** (418, 451...) use karne se clients confuse ho sakte hain. Common set kaafi hai: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500, 503.

Rule: standard set use karo, aur jo bhi choose karo, poori API mein same rakho.`,
          en: `Strict REST methods do not always fit:

- **Non-CRUD actions** like "cancel order" are often modelled as \`POST /orders/42/cancel\`. That is fine if you stay consistent.
- **GraphQL** sends most requests as \`POST /graphql\` and often returns errors inside a \`200\` body, so monitoring must read the body.
- **gRPC** uses its own status codes.
- **Too many rare codes** confuse clients. A common set (200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500, 503) is usually enough.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real project (maan lo ek college canteen ordering app) mein ye aise dikhega:

- \`GET /menu\` → \`200\` with items.
- \`POST /orders\` → \`201\` + naya order; item out of stock → \`409 Conflict\`; quantity negative → \`400\`.
- \`GET /orders/:id\` → kisi aur ka order maanga → \`404\` (ya \`403\`), apna → \`200\`.
- \`DELETE /orders/:id\` → \`204\`.
- Bahut zyada requests → \`429 Too Many Requests\`.

Team ek **error format** fix karti hai, jaise:

\`\`\`json
{ "error": { "code": "OUT_OF_STOCK", "message": "Masala dosa is sold out" } }
\`\`\`

Aur ek central error handler sab exceptions ko sahi status mein convert karta hai. Dashboard pe 5xx rate ka alert lagta hai. Ye discipline interview mein bhi dikhta hai — "tumne 201 kyun bheja?" ka confident jawab do.`,
          en: `In a real project, say a college canteen ordering app:

- \`GET /menu\` returns \`200\`.
- \`POST /orders\` returns \`201\`; out of stock returns \`409\`; a negative quantity returns \`400\`.
- \`GET /orders/:id\` for someone else's order returns \`404\` or \`403\`.
- \`DELETE /orders/:id\` returns \`204\`.
- Too many requests returns \`429\`.

The team fixes one JSON error format, uses a central error handler to map exceptions to status codes, and alerts on the 5xx rate.`,
        },
      },
    ],
    visualization: {
      kind: "REQUEST_RESPONSE",
      title: "Life of POST /orders",
      steps: [
        { title: "Client sends request", description: "The app sends POST /orders with a JSON body and Content-Type header.", highlight: "POST /orders" },
        { title: "Router matches method + path", description: "The server picks the handler registered for POST on /orders, not the GET one.", highlight: "method + path" },
        { title: "Validation", description: "If quantity is missing or negative, the server stops here and returns 400 Bad Request.", highlight: "400" },
        { title: "Create resource", description: "The order is saved in the database and gets a new id.", highlight: "INSERT" },
        { title: "Response with status", description: "Server replies 201 Created with the new order in the body.", highlight: "201 Created" },
        { title: "Client reacts", description: "The app reads the status first: 2xx shows success, 4xx shows a fix-your-input message, 5xx shows try-again.", highlight: "2xx / 4xx / 5xx" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "A POST /users request successfully creates a new user. Which status code is the best fit?",
        options: ["200 OK", "201 Created", "204 No Content", "302 Found"],
        correct: [1],
        explanation: "Naya resource bana hai, isliye **201 Created** sabse sahi hai. 200 bhi chal jaata hai par 201 clearly batata hai ki kuch create hua. 204 tab jab body bhejni hi nahi.",
        tags: ["status-codes"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "A logged-in user tries to open the admin dashboard but is not an admin. What should the API return?",
        options: ["400 Bad Request", "401 Unauthorized", "403 Forbidden", "500 Internal Server Error"],
        correct: [2],
        explanation: "User logged in hai (server jaanta hai kaun hai), bas permission nahi hai → **403 Forbidden**. 401 tab jab login hi nahi hua ya token galat hai.",
        tags: ["status-codes", "auth"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Which HTTP method is both safe and idempotent?",
        options: ["POST", "PATCH", "GET", "DELETE"],
        correct: [2],
        explanation: "**GET** data nahi badalta (safe) aur kitni baar bhi bhejo result same (idempotent). DELETE idempotent hai par safe nahi, kyunki data hata deta hai.",
        tags: ["methods"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these methods are idempotent by the HTTP spec? (Select all that apply)",
        options: ["GET", "POST", "PUT", "DELETE"],
        correct: [0, 2, 3],
        explanation: "GET, PUT aur DELETE idempotent hain — ek baar ya paanch baar, final state same. **POST** har baar naya resource bana sakta hai, isliye retry pe duplicate order ka risk hota hai.",
        tags: ["methods", "idempotency"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 1,
        prompt: "What does this code print?",
        code: `function category(code) {
  if (code >= 500) return "server";
  if (code >= 400) return "client";
  if (code >= 300) return "redirect";
  return "ok";
}
console.log([201, 404, 503, 304].map(category).join(","));`,
        codeLanguage: "javascript",
        options: ["ok,client,server,redirect", "ok,server,client,redirect", "ok,client,server,ok", "redirect,client,server,ok"],
        correct: [0],
        explanation: "201 → koi if match nahi → \"ok\". 404 → 400 se bada → \"client\". 503 → \"server\". 304 → 300 se bada → \"redirect\". Checks bade number se shuru hote hain, isliye order sahi kaam karta hai.",
        tags: ["status-codes"],
      },
      {
        type: "SCENARIO",
        difficulty: 3,
        prompt: "Users on slow mobile networks sometimes get charged twice. The app retries POST /payments when the request times out. What is the best fix?",
        options: [
          "Change POST /payments to GET /payments so it becomes idempotent",
          "Send an idempotency key with each payment; the server stores it and returns the first result for repeated keys",
          "Remove retries completely and show an error on every timeout",
          "Return 500 on the second request so the client stops",
        ],
        correct: [1],
        explanation: "POST idempotent nahi hai, isliye retry = double charge. **Idempotency key** (jaise Stripe/Razorpay karte hain) se server pehchaan leta hai ki ye wahi payment hai aur pehla result lauta deta hai. GET se data badalna galat hai, aur retries hatana user experience kharab karta hai.",
        tags: ["idempotency", "payments"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 1,
        prompt: "Put the life of an API call in the correct order.",
        options: [
          "Client sends POST /orders with a JSON body",
          "Server router matches the method and path to a handler",
          "Handler validates the body and saves the order",
          "Server responds with 201 Created and the new order",
          "Client reads the status code and shows success",
        ],
        explanation: "Request jaati hai → router method+path se handler chunta hai → handler validate karke save karta hai → status ke saath response → client status padh ke UI update karta hai.",
        tags: ["request-lifecycle"],
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Explain the difference between 401 Unauthorized and 403 Forbidden with an example.",
        keywords: ["authentication", "not logged in", "permission", "logged in", "forbidden"],
        explanation: "401 = authentication fail (login nahi kiya / token galat). 403 = server jaanta hai tum kaun ho, par permission nahi (jaise normal user admin page khole). Naam confusing hai — 401 asal mein 'unauthenticated' hai.",
        tags: ["status-codes", "auth"],
      },
    ],
    buildTask: {
      title: "Status code classifier",
      description: `Ek function likho \`statusCategory(code)\` jo HTTP status code ko uski category mein daale. Monitoring dashboards exactly yahi karte hain — 5xx gin ke alert bhejte hain.

Return values (exact strings):
- 100–199 → \`"informational"\`
- 200–299 → \`"success"\`
- 300–399 → \`"redirect"\`
- 400–499 → \`"client_error"\`
- 500–599 → \`"server_error"\`
- Kuch bhi aur (jaise 99, 600, 0) → \`"invalid"\`

Input hamesha integer hoga.`,
      functionName: "statusCategory",
      starterJs: `function statusCategory(code) {
  // return "informational" | "success" | "redirect" | "client_error" | "server_error" | "invalid"
  return "";
}
`,
      starterPython: `def statusCategory(code):
    # return "informational" | "success" | "redirect" | "client_error" | "server_error" | "invalid"
    return ""
`,
      tests: [
        { name: "200 is success", args: [200], expected: "success" },
        { name: "201 is success", args: [201], expected: "success" },
        { name: "404 is client error", args: [404], expected: "client_error" },
        { name: "503 is server error", args: [503], expected: "server_error" },
        { name: "301 is redirect", args: [301], expected: "redirect" },
        { name: "600 is invalid", args: [600], expected: "invalid", hidden: true },
        { name: "100 is informational", args: [100], expected: "informational", hidden: true },
      ],
      hints: [
        "Status code ka pehla digit hi category hai. 4xx = client, 5xx = server. Range se bahar = invalid.",
        "Pehle check karo code 100 se chhota ya 599 se bada to nahi — wo invalid hai. Phir Math.floor(code / 100) se pehla digit nikalo.",
        "JS: const d = Math.floor(code / 100); const names = {1: \"informational\", 2: \"success\", 3: \"redirect\", 4: \"client_error\", 5: \"server_error\"}; return names[d] || \"invalid\";",
      ],
      explainQuestions: [
        { question: "Why does the first digit of a status code alone tell you the category?", keywords: ["first digit", "range", "standard", "category"] },
        { question: "Why should an API return 4xx instead of 200 with an error message in the body?", keywords: ["monitoring", "client", "retry", "status"] },
        { question: "Why should a 500 response not include the stack trace? (security)", keywords: ["leak", "internal", "attacker", "logs"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "What is the difference between PUT and PATCH?",
        short: "PUT replaces the whole resource with the body you send, so missing fields may be cleared. PATCH applies a partial update and only changes the fields you send. PUT is idempotent by definition; PATCH is not guaranteed to be.",
        deep: `- **PUT /users/7** with \`{"name":"Asha"}\` means "user 7 should now be exactly this". If \`email\` is missing, a strict implementation clears it.
- **PATCH /users/7** with \`{"name":"Asha"}\` means "only change the name".
- **Idempotency**: sending the same PUT twice leaves the same state. A PATCH like \`{"op":"increment","field":"views"}\` changes state on every call, so PATCH is not idempotent in general.
- In practice most apps use PATCH for edit forms and PUT for "upsert/replace" style endpoints such as uploading a file to a known key.`,
        followUps: ["Can PUT create a resource?", "How would you make a PATCH endpoint safe to retry?", "What status code does a successful PATCH return?"],
        commonMistake: "Saying PUT and PATCH are the same and using PUT for partial updates, which silently wipes fields the client did not send.",
        keywords: ["replace", "partial update", "idempotent", "missing fields"],
        difficulty: 1,
        roles: ["BACKEND", "FULLSTACK"],
      },
      {
        question: "What does idempotent mean, and why does it matter for retries?",
        short: "An operation is idempotent if doing it once or many times leaves the server in the same final state. GET, PUT and DELETE are idempotent; POST is not. Clients and proxies can safely retry idempotent requests after a timeout, but retrying POST can create duplicates unless you use an idempotency key.",
        deep: `- Networks fail mid-request: the server may have processed the request but the response was lost.
- For **DELETE /orders/5**, retrying is fine — the order is deleted either way (the second call may return 404, but the state is the same).
- For **POST /payments**, retrying may charge twice.
- Fix: the client sends an \`Idempotency-Key\` header (a UUID). The server stores key → result; a repeated key returns the stored result instead of doing the work again.
- Note: idempotent is about **state**, not about getting the same response code.`,
        followUps: ["Where would you store idempotency keys and for how long?", "Is DELETE returning 404 on the second call still idempotent?"],
        commonMistake: "Confusing idempotent with safe, or thinking idempotent means the response must be identical.",
        keywords: ["same final state", "retry", "idempotency key", "post duplicates"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK", "SDE"],
      },
      {
        question: "When would you return 400, 404, 409 and 422?",
        short: "400 when the request is malformed, like invalid JSON. 404 when the resource does not exist or the caller must not know it exists. 409 when the request conflicts with current state, like a duplicate email. 422 when the JSON is valid but fails business validation rules.",
        deep: `- **400 Bad Request**: cannot even parse it — broken JSON, wrong types.
- **404 Not Found**: no such resource. Also used to hide resources the user may not see (prevents leaking that an id exists).
- **409 Conflict**: state conflict — username already taken, editing a stale version.
- **422 Unprocessable Entity**: well-formed but semantically invalid — \`age: -3\`.
- Many teams simply use 400 for all validation errors; what matters most is being **consistent** and returning a clear error body.`,
        followUps: ["Would you return 403 or 404 for another user's private resource?", "What does 429 mean?"],
        commonMistake: "Returning 500 for validation errors, which hides client mistakes as server failures.",
        keywords: ["malformed", "conflict", "validation", "consistent"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK"],
      },
    ],
  },
  // ───────────────────────────── 2. REST API design ─────────────────────────────
  {
    slug: "rest-api-design",
    estMinutes: 40,
    difficulty: 2,
    prerequisites: ["http-methods-status", "what-is-an-api", "json-basics"],
    objectives: [
      "Model an API around resources (nouns) and use HTTP methods as verbs",
      "Design nested URLs, filters, sorting and pagination for list endpoints",
      "Keep a consistent response and error format across endpoints",
      "Version an API without breaking existing mobile and web clients",
    ],
    technicalDefinition:
      "REST (Representational State Transfer) is an architectural style for networked APIs in which resources are identified by URLs, manipulated through a uniform interface of standard HTTP methods, exchanged as representations such as JSON, and each request is stateless and self-contained.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**REST API design** matlab apni API ko **resources** (cheezon) ke around banana, actions ke around nahi.

- URL mein **noun** hota hai: \`/users\`, \`/orders/42\`, \`/users/7/orders\`.
- Kaam batata hai **HTTP method**: \`GET\` padho, \`POST\` banao, \`PATCH\` badlo, \`DELETE\` hatao.
- Data aata-jaata hai **JSON** mein.
- Har request **stateless** hoti hai — server ko pichli request yaad rakhne ki zaroorat nahi, sab kuch (token, filters) request ke andar hi hota hai.

To \`/getAllOrdersForUser?id=7\` ki jagah likho \`GET /users/7/orders\`. Padhte hi samajh aa jaata hai. Achha REST design = koi bhi developer bina documentation ke bhi aadha andaza laga le.`,
          en: `**REST API design** means building your API around **resources** (things), not actions.

- The URL holds a **noun**: \`/users\`, \`/orders/42\`, \`/users/7/orders\`.
- The **HTTP method** says what to do: \`GET\` read, \`POST\` create, \`PATCH\` update, \`DELETE\` remove.
- Data is exchanged as **JSON**.
- Each request is **stateless**: everything the server needs (token, filters) is inside the request.

So instead of \`/getAllOrdersForUser?id=7\` you write \`GET /users/7/orders\`, which any developer can read at a glance.`,
          hi: `**REST API डिज़ाइन** का मतलब है अपनी API को **संसाधनों** (चीज़ों) के आसपास बनाना, क्रियाओं के आसपास नहीं।

- URL में **संज्ञा** होती है: \`/users\`, \`/orders/42\`, \`/users/7/orders\`।
- काम **HTTP method** बताता है: \`GET\` पढ़ो, \`POST\` बनाओ, \`PATCH\` बदलो, \`DELETE\` हटाओ।
- डेटा **JSON** में आता-जाता है।
- हर request **stateless** होती है — सर्वर को पिछली request याद रखने की ज़रूरत नहीं।

इसलिए \`/getAllOrdersForUser?id=7\` की जगह \`GET /users/7/orders\` लिखें, जिसे कोई भी डेवलपर तुरंत समझ ले।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Library** socho. Library mein shelves cheezon ke naam se lagi hain: "Books", "Magazines", "Members". Har book ka ek fixed number hai — \`Books/42\`.

Ab librarian ko tum sirf chaar-paanch standard kaam bolte ho: "dikhao" (GET), "naya add karo" (POST), "update karo" (PATCH), "hata do" (DELETE). Tum ye nahi bolte ki "mujhe-sharma-ji-ki-sabse-nayi-book-laake-do" naam ka naya counter kholo.

Agar filter chahiye to bolte ho: "Books dikhao jahan author = Premchand, 10-10 karke, page 2" → \`GET /books?author=premchand&page=2&limit=10\`.

Member ki issued books? → \`GET /members/7/books\`. Shelf ka structure hi API ka structure hai. Naya librarian aaye to bhi system samajh jaata hai — yahi REST ki taakat hai.`,
          en: `Think of a **library**. Shelves are organised by things: "Books", "Magazines", "Members". Each book has a fixed number, like \`Books/42\`.

You ask the librarian for only a few standard actions: show (GET), add (POST), update (PATCH), remove (DELETE). You never open a special counter called "bring-me-the-newest-book-by-sharma".

To filter, you say "show books by Premchand, ten at a time, page 2": \`GET /books?author=premchand&page=2&limit=10\`. A member's issued books are \`GET /members/7/books\`. The shelf layout is the API layout, so any new librarian understands it.`,
          hi: `एक **लाइब्रेरी** सोचिए। अलमारियाँ चीज़ों के नाम से लगी हैं: "किताबें", "पत्रिकाएँ", "सदस्य"। हर किताब का एक तय नंबर है — \`Books/42\`।

आप लाइब्रेरियन से कुछ ही मानक काम कहते हैं: "दिखाओ" (GET), "नया जोड़ो" (POST), "बदलो" (PATCH), "हटाओ" (DELETE)।

फ़िल्टर चाहिए तो कहते हैं: "प्रेमचंद की किताबें दिखाओ, दस-दस करके, पेज 2" → \`GET /books?author=premchand&page=2&limit=10\`।

सदस्य की ली हुई किताबें → \`GET /members/7/books\`। अलमारियों की व्यवस्था ही API की व्यवस्था है, इसलिए नया लाइब्रेरियन भी तुरंत समझ जाता है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Bina design ke API aisi ban jaati hai: \`/getUser\`, \`/fetchUserData\`, \`/user_details_new\`, \`/deleteUserById\`... Har developer ne apna style chalaya. Result:

- Frontend wale ko har endpoint ke liye docs padhne padte hain.
- Koi endpoint 200 ke saath error bhejta hai, koi 500 ke saath.
- List endpoints saare 50,000 rows ek saath bhej dete hain — app hang.
- Field ka naam badla aur purani mobile app (jo Play Store pe hai, update nahi hui) crash.

REST conventions in sab ka simple solution hain: **predictable URLs**, **standard methods**, **consistent JSON shape**, **pagination**, aur **versioning**. Team badi ho ya chhoti, sab ek hi language bolte hain, aur naya intern bhi pehle din se kaam kar paata hai.`,
          en: `Without design, APIs grow into \`/getUser\`, \`/fetchUserData\`, \`/user_details_new\`, \`/deleteUserById\`, each in a different style. Then:

- Frontend developers must read docs for every endpoint.
- Errors come back in different shapes and codes.
- List endpoints return 50,000 rows at once and the app freezes.
- Renaming a field crashes old mobile app versions still in use.

REST conventions fix this with **predictable URLs**, **standard methods**, **consistent JSON**, **pagination** and **versioning**, so everyone speaks the same language.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Kuch real examples (ye sab public docs mein dekh sakte ho):

- **GitHub REST API**: \`GET /repos/{owner}/{repo}/issues\` — nested resource. List pe pagination hai, aur next page ka link \`Link\` header mein aata hai. Version header se choose hota hai.
- **Stripe API**: resources jaise \`/v1/customers\`, \`/v1/charges\`. URL mein \`v1\` hai, aur list endpoints **cursor pagination** use karte hain (\`starting_after\` param) taaki bade data pe bhi fast rahe.
- **Food delivery app (Swiggy/Zomato type)**: \`GET /restaurants?city=pune&cuisine=south-indian&sort=rating\` — filters aur sort query params mein, aur infinite scroll ke liye page-by-page data.

Pattern sab jagah same: nouns, methods, filters in query, pagination, versioning.`,
          en: `Real examples you can check in public docs:

- **GitHub's REST API** uses nested resources like \`GET /repos/{owner}/{repo}/issues\`, paginates lists and returns the next page link in a \`Link\` header.
- **Stripe** exposes \`/v1/customers\` and \`/v1/charges\`, keeps the version in the URL, and uses **cursor pagination** (\`starting_after\`) for large lists.
- **A food-delivery app** might call \`GET /restaurants?city=pune&cuisine=south-indian&sort=rating\` with filters and sorting in query params and page-by-page loading for infinite scroll.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Ek achhe REST endpoint ke andar ye pieces hote hain:

1. **Resource path**: \`/v1/restaurants/12/reviews\` — version, collection, id, sub-collection.
2. **Query params** sirf "kaise dikhana hai" ke liye: \`?rating_gte=4&sort=-createdAt&page=2&limit=20\`.
3. **Handler** query ko DB query mein badalta hai: \`WHERE restaurant_id = 12 AND rating >= 4 ORDER BY created_at DESC LIMIT 20 OFFSET 20\`.
4. **Response envelope** consistent hota hai:

\`\`\`json
{ "data": [ ... ], "meta": { "page": 2, "limit": 20, "total": 134 } }
\`\`\`

5. **Errors** bhi ek hi shape mein: \`{ "error": { "code": "VALIDATION_FAILED", "message": "..." } }\`.

Stateless hone ki wajah se koi bhi server instance request handle kar sakta hai — load balancer aaram se 10 servers mein traffic baant deta hai.`,
          en: `A good REST endpoint has these pieces:

1. **Resource path** like \`/v1/restaurants/12/reviews\`: version, collection, id, sub-collection.
2. **Query params** only for how to show data: filters, sort, page, limit.
3. The **handler** turns them into a DB query with \`WHERE\`, \`ORDER BY\`, \`LIMIT\` and \`OFFSET\`.
4. A consistent **response envelope**: \`{ "data": [...], "meta": {...} }\`.
5. A single **error shape** for every endpoint.

Because requests are stateless, any server instance can handle any request, so load balancing is easy.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Ye code ek **list endpoint** simulate karta hai: \`GET /products?category=snacks&page=1&limit=2\`.

- \`products\` hamara fake table hai.
- \`listProducts(query)\` pehle **filter** lagata hai (category), phir **sort** (price), phir **paginate**.
- \`limit\` ko 1 se 50 ke beech **clamp** karte hain taaki koi \`limit=100000\` bhej ke server na bitha de.
- Response hamesha same shape: \`{ data, meta }\`, jahan \`meta\` mein \`page\`, \`limit\`, \`total\`, \`totalPages\`.

Express mein yahi logic aise lagta:

\`\`\`js
app.get("/v1/products", (req, res) => {
  res.json(listProducts(req.query));
});
\`\`\`

Output mein dekho: page 2 pe agla chunk aata hai, aur filter lagne pe \`total\` kam ho jaata hai.`,
          en: `This code simulates a **list endpoint** like \`GET /products?category=snacks&page=1&limit=2\`.

- \`products\` is a fake table.
- \`listProducts(query)\` filters by category, sorts by price, then paginates.
- \`limit\` is **clamped** between 1 and 50 so nobody can request a huge page.
- The response always has the same shape: \`{ data, meta }\` with page, limit, total and totalPages.

In Express the handler would just call \`res.json(listProducts(req.query))\`. Compare the outputs for page 1, page 2 and the filtered call.`,
        },
        codeJs: `const products = [
  { id: 1, name: "Samosa", category: "snacks", price: 15 },
  { id: 2, name: "Masala Chai", category: "drinks", price: 10 },
  { id: 3, name: "Vada Pav", category: "snacks", price: 20 },
  { id: 4, name: "Cold Coffee", category: "drinks", price: 40 },
  { id: 5, name: "Poha", category: "snacks", price: 25 },
];

function listProducts(query) {
  let rows = products;
  if (query.category) rows = rows.filter((p) => p.category === query.category);
  rows = [...rows].sort((a, b) => a.price - b.price);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
  const page = Math.max(Number(query.page) || 1, 1);
  const start = (page - 1) * limit;
  return {
    data: rows.slice(start, start + limit).map((p) => p.name),
    meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) },
  };
}

console.log(JSON.stringify(listProducts({ page: 1, limit: 2 })));
console.log(JSON.stringify(listProducts({ page: 2, limit: 2 })));
console.log(JSON.stringify(listProducts({ category: "snacks", limit: 100000 })));
`,
        codePython: `import json
import math

products = [
    {"id": 1, "name": "Samosa", "category": "snacks", "price": 15},
    {"id": 2, "name": "Masala Chai", "category": "drinks", "price": 10},
    {"id": 3, "name": "Vada Pav", "category": "snacks", "price": 20},
    {"id": 4, "name": "Cold Coffee", "category": "drinks", "price": 40},
    {"id": 5, "name": "Poha", "category": "snacks", "price": 25},
]


def list_products(query):
    rows = products
    if query.get("category"):
        rows = [p for p in rows if p["category"] == query["category"]]
    rows = sorted(rows, key=lambda p: p["price"])
    limit = min(max(int(query.get("limit") or 10), 1), 50)
    page = max(int(query.get("page") or 1), 1)
    start = (page - 1) * limit
    return {
        "data": [p["name"] for p in rows[start:start + limit]],
        "meta": {"page": page, "limit": limit, "total": len(rows),
                 "totalPages": math.ceil(len(rows) / limit)},
    }


print(json.dumps(list_products({"page": 1, "limit": 2})))
print(json.dumps(list_products({"page": 2, "limit": 2})))
print(json.dumps(list_products({"category": "snacks", "limit": 100000})))
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Common galtiyan jo code review mein turant pakdi jaati hain:

- **Verbs in URL**: \`POST /createOrder\`, \`GET /getOrders\`. Method already verb hai — likho \`POST /orders\`.
- **Singular/plural mix**: kahin \`/user/5\`, kahin \`/orders\`. Ek rule rakho, usually plural.
- **No pagination**: \`GET /orders\` saare 2 lakh orders bhej deta hai. Hamesha \`limit\` aur max limit rakho.
- **DB row seedha return karna**: \`passwordHash\`, internal flags bhi response mein chale gaye. Response ke liye alag shape (DTO) banao.
- **Inconsistent errors**: ek endpoint \`{msg}\` bhejta hai, doosra \`{error}\`. Ek format fix karo.
- **Breaking change bina version ke**: field rename kiya aur purani app toot gayi.
- **Bahut deep nesting**: \`/users/1/orders/2/items/3/reviews\` — 2 level ke baad flat karo: \`/order-items/3/reviews\`.`,
          en: `Mistakes reviewers catch quickly:

- **Verbs in URLs** like \`POST /createOrder\`; the method is already the verb.
- **Mixing singular and plural** paths.
- **No pagination**, so one call returns every row.
- **Returning raw DB rows**, leaking fields like \`passwordHash\`.
- **Inconsistent error shapes** across endpoints.
- **Breaking changes without versioning**, crashing old app versions.
- **Very deep nesting**; after two levels, flatten the URL.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `API design ke problems kaise pakdo:

1. **OpenAPI/Swagger spec** banao aur padho — saare endpoints ek list mein dikhte hain, inconsistency (\`/user\` vs \`/users\`) turant nazar aati hai.
2. **Slow list endpoint?** Check karo pagination hai ya nahi, aur \`limit\` ka max hai ya nahi. Logs mein response size dekho.
3. **"Frontend ko field nahi mil raha"**: Postman/curl se actual response dekho. Aksar field ka naam alag case mein hota hai (\`created_at\` vs \`createdAt\`). Ek convention fix karo.
4. **Purani app crash after deploy**: diff karo old vs new response JSON. Koi field hata/rename to nahi kiya?
5. **Contract tests** likho: response ka shape (keys aur types) assert karo, taaki galti se breaking change merge hi na ho.

\`\`\`bash
curl -s "http://localhost:3000/v1/products?page=2&limit=5" | jq '.meta'
\`\`\``,
          en: `How to find design problems:

1. Write an **OpenAPI spec**; seeing all endpoints in one list exposes inconsistencies.
2. For a **slow list endpoint**, check pagination and a max \`limit\`, and log response sizes.
3. When the frontend "cannot find a field", inspect the real response with curl or Postman; naming case mismatches are common.
4. If **old apps crash after a deploy**, diff old and new response JSON for renamed or removed fields.
5. Add **contract tests** that assert response shape.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `REST har jagah best nahi hai:

- **GraphQL**: jab mobile screen ko 5 alag resources se thoda-thoda data chahiye, REST mein 5 calls lagti hain (ya over-fetching). GraphQL ek query mein exactly wahi fields deta hai. Par caching aur rate limiting mushkil ho jaati hai.
- **gRPC**: internal microservices ke beech fast binary communication ke liye achha. Browser se directly use karna mushkil.
- **WebSockets**: live chat, live cricket score — REST mein baar baar poll karna padega, WebSocket push karta hai.
- **Offset vs cursor pagination**: offset (\`page=500\`) simple hai par deep pages pe slow, aur beech mein naya data aaye to items repeat/miss ho jaate hain. Cursor (\`after=lastId\`) fast aur stable hai, par "page 37 pe jump karo" nahi kar sakte.

Public, CRUD-heavy APIs ke liye REST abhi bhi default choice hai.`,
          en: `REST is not always the best fit:

- **GraphQL** lets a screen fetch exactly the fields it needs from many resources in one query, but caching and rate limiting get harder.
- **gRPC** suits fast internal service-to-service calls, less so browsers.
- **WebSockets** suit live updates like chat or cricket scores instead of polling.
- **Offset vs cursor pagination**: offset is simple but slow for deep pages and can skip or repeat items; cursor is fast and stable but cannot jump to page 37.

For public CRUD-style APIs, REST remains the default.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek real project (maan lo "CampusKart" — college ka buy/sell app) ka API plan:

\`\`\`text
GET    /v1/listings?category=books&sort=-createdAt&limit=20&cursor=abc
POST   /v1/listings
GET    /v1/listings/:id
PATCH  /v1/listings/:id          (sirf owner)
DELETE /v1/listings/:id          (sirf owner)
GET    /v1/users/me/listings
POST   /v1/listings/:id/reports  (spam report)
\`\`\`

Team ye decisions likh ke rakhti hai: JSON keys camelCase, errors \`{ error: { code, message } }\`, max limit 50, timestamps ISO format, \`/v1\` prefix. Ek **OpenAPI file** repo mein rehti hai jisse frontend ke types bhi generate hote hain. Jab field rename karna ho to pehle naya field add, kuch hafte dono bhejo, phir purana hatao — ise **deprecation** kehte hain.`,
          en: `A real project plan for a campus buy-and-sell app:

- \`GET /v1/listings?category=books&sort=-createdAt&limit=20&cursor=abc\`
- \`POST /v1/listings\`, \`GET/PATCH/DELETE /v1/listings/:id\` (edit and delete only by the owner)
- \`GET /v1/users/me/listings\`
- \`POST /v1/listings/:id/reports\`

The team documents decisions: camelCase keys, one error shape, max limit 50, ISO timestamps, a \`/v1\` prefix. An OpenAPI file generates frontend types. Renames follow **deprecation**: add the new field, send both for a while, then remove the old one.`,
        },
      },
    ],
    visualization: {
      kind: "FLOW",
      title: "From feature idea to REST endpoint",
      steps: [
        { title: "Find the resource", description: "Feature: students review canteen dishes. Resources: dishes and reviews.", highlight: "nouns" },
        { title: "Pick URL + method", description: "POST /v1/dishes/:id/reviews to add, GET /v1/dishes/:id/reviews to list.", highlight: "POST / GET" },
        { title: "Define request and response shape", description: "Body { rating, comment }; response { data, meta } with camelCase keys.", highlight: "{ data, meta }" },
        { title: "Add list controls", description: "Support ?sort=-createdAt&limit=20&cursor=... with a max limit of 50.", highlight: "pagination" },
        { title: "Define errors", description: "400 for bad rating, 401 when not logged in, 404 for unknown dish, all in one error format.", highlight: "error shape" },
        { title: "Document and version", description: "Write it in the OpenAPI spec under /v1 so clients can rely on it.", highlight: "/v1" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which endpoint best follows REST conventions for fetching all orders of user 7?",
        options: ["GET /getOrders?user=7", "GET /users/7/orders", "POST /users/7/fetchOrders", "GET /orderList/user7"],
        correct: [1],
        explanation: "REST mein URL noun hota hai aur nesting relationship batati hai: **user 7 ke orders** → \`/users/7/orders\`. Verb (get/fetch) method se aata hai, URL se nahi.",
        tags: ["urls"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Why do list endpoints like GET /orders need pagination?",
        options: [
          "Because GET requests cannot return arrays",
          "To avoid sending thousands of rows in one response, which is slow for the server, network and app",
          "Because browsers only accept 20 items",
          "Pagination is only needed for POST requests",
        ],
        correct: [1],
        explanation: "Data badhta rehta hai. Bina pagination ke ek call mein lakhon rows → DB slow, response heavy, mobile app hang. \`limit\` + max limit rakhna zaroori hai.",
        tags: ["pagination"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "What does it mean that REST requests are stateless?",
        options: [
          "The server never uses a database",
          "Each request carries everything needed (like the auth token), so any server instance can handle it",
          "Responses cannot contain status codes",
          "The client cannot store any data",
        ],
        correct: [1],
        explanation: "Stateless = server pichli request ka context memory mein nahi rakhta. Token, filters sab request mein. Isliye load balancer kisi bhi server pe bhej sakta hai. Data DB mein to rehta hi hai.",
        tags: ["stateless"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these are good REST API practices? (Select all that apply)",
        options: [
          "Use plural nouns like /products in URLs",
          "Return the raw database row including passwordHash",
          "Use one consistent error format across endpoints",
          "Put a maximum on the limit query parameter",
        ],
        correct: [0, 2, 3],
        explanation: "Plural nouns, ek error format aur max limit — teeno achhe practices hain. Raw DB row bhejna **data leak** hai; response ke liye alag safe shape banao.",
        tags: ["best-practices"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "This code computes page 3 of a list with page size 10. What does it print?",
        code: `items = list(range(1, 24))
page, size = 3, 10
start = (page - 1) * size
chunk = items[start:start + size]
print(len(chunk), chunk[0], -(-len(items) // size))`,
        codeLanguage: "python",
        options: ["3 21 3", "10 21 3", "3 20 2", "3 21 2"],
        correct: [0],
        explanation: "23 items hain (1 se 23). Page 3 ka start index 20 → value 21. Bache sirf 3 items (21, 22, 23). \`-(-23 // 10)\` ceiling division hai = 3 total pages.",
        tags: ["pagination"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "Your Android app (many users never update) reads the field `name` from GET /v1/users/me. Product wants it renamed to `fullName`. What is the safest approach?",
        options: [
          "Rename it today; users should update the app",
          "Add `fullName` alongside `name`, mark `name` deprecated, and remove it only in /v2 or after old versions are gone",
          "Return both fields only on Sundays",
          "Change the endpoint to POST so old apps stop calling it",
        ],
        correct: [1],
        explanation: "Mobile apps turant update nahi hoti. **Additive change** (naya field add karna) safe hai; hatana breaking hai. Dono bhejo, deprecate karo, aur version badalne pe purana hatao.",
        tags: ["versioning"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps to design a new REST endpoint.",
        options: [
          "Identify the resource (noun) the feature is about",
          "Choose the URL and HTTP method",
          "Define the request body and response shape",
          "Decide error cases and their status codes",
          "Document it in the OpenAPI spec and share with clients",
        ],
        explanation: "Pehle resource samjho, phir URL+method, phir data ka shape, phir errors, aur last mein documentation taaki frontend/mobile team use kar sake.",
        tags: ["design-process"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why does offset pagination get slow on deep pages, and how does cursor pagination fix it?",
        keywords: ["offset", "skip rows", "cursor", "last id", "index"],
        explanation: "\`OFFSET 100000\` mein DB ko pehle 1 lakh rows padh ke phekni padti hain. Cursor pagination \`WHERE id > lastId ORDER BY id LIMIT 20\` likhta hai — index se seedha sahi jagah pahunchta hai, aur naye items aane pe duplicates bhi nahi aate.",
        tags: ["pagination", "performance"],
      },
    ],
    buildTask: {
      title: "Paginate a list endpoint",
      description: `Har list API ke peeche ek pagination function hota hai. Likho \`paginate(items, page, pageSize)\` jo return kare:

\`\`\`json
{ "items": [...], "page": 2, "pageSize": 10, "total": 23, "totalPages": 3 }
\`\`\`

Rules:
- \`page\` 1 se shuru hota hai. Agar \`page < 1\` ho to use **1** maano.
- \`pageSize\` ko **1 se 50** ke beech clamp karo (0 → 1, 500 → 50).
- \`totalPages\` = ceil(total / pageSize). Khaali list pe 0.
- Agar page range se bahar hai to \`items\` khaali array \`[]\`.
- Returned \`page\` aur \`pageSize\` clamp ke baad wale values hon.`,
      functionName: "paginate",
      starterJs: `function paginate(items, page, pageSize) {
  // return { items, page, pageSize, total, totalPages }
  return {};
}
`,
      starterPython: `def paginate(items, page, pageSize):
    # return {"items": [...], "page": ..., "pageSize": ..., "total": ..., "totalPages": ...}
    return {}
`,
      tests: [
        { name: "first page", args: [[1, 2, 3, 4, 5], 1, 2], expected: { items: [1, 2], page: 1, pageSize: 2, total: 5, totalPages: 3 } },
        { name: "last partial page", args: [[1, 2, 3, 4, 5], 3, 2], expected: { items: [5], page: 3, pageSize: 2, total: 5, totalPages: 3 } },
        { name: "page beyond range", args: [["a", "b"], 4, 2], expected: { items: [], page: 4, pageSize: 2, total: 2, totalPages: 1 } },
        { name: "empty list", args: [[], 1, 10], expected: { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 } },
        { name: "page below 1 becomes 1", args: [[1, 2, 3], 0, 2], expected: { items: [1, 2], page: 1, pageSize: 2, total: 3, totalPages: 2 } },
        { name: "pageSize clamped to 50", args: [[1, 2, 3], 1, 500], expected: { items: [1, 2, 3], page: 1, pageSize: 50, total: 3, totalPages: 1 }, hidden: true },
        { name: "pageSize 0 clamped to 1", args: [["x", "y", "z"], 2, 0], expected: { items: ["y"], page: 2, pageSize: 1, total: 3, totalPages: 3 }, hidden: true },
      ],
      hints: [
        "Pagination = slicing. Page p ka data index (p - 1) * size se shuru hota hai aur size items tak jaata hai.",
        "Pehle page aur pageSize clamp karo, phir start = (page - 1) * pageSize nikalo, phir slice karo. totalPages ke liye ceiling division.",
        "JS: const size = Math.min(Math.max(pageSize, 1), 50); const p = Math.max(page, 1); const start = (p - 1) * size; return { items: items.slice(start, start + size), page: p, pageSize: size, total: items.length, totalPages: Math.ceil(items.length / size) };",
      ],
      explainQuestions: [
        { question: "Why do you clamp pageSize to a maximum like 50?", keywords: ["abuse", "memory", "slow", "maximum"] },
        { question: "How did you compute totalPages, and what happens with an empty list?", keywords: ["ceil", "total", "zero", "pagesize"] },
        { question: "What could go wrong security-wise if a client can request pageSize=1000000? (security)", keywords: ["denial of service", "memory", "database load", "limit"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "What makes an API RESTful?",
        short: "A RESTful API models data as resources identified by URLs, uses standard HTTP methods as the operations, returns proper status codes, exchanges representations like JSON, and keeps each request stateless so it carries its own auth and context.",
        deep: `Key constraints from Roy Fielding's REST style, in practical terms:
- **Resources and URLs**: \`/orders/42\`, nouns not verbs.
- **Uniform interface**: GET/POST/PUT/PATCH/DELETE with their standard meaning, plus status codes.
- **Stateless**: no server-side conversation state between requests; auth token in every request.
- **Cacheable**: responses can declare cacheability (\`Cache-Control\`, \`ETag\`).
- **Layered system**: clients do not care about load balancers or CDNs in between.
- HATEOAS (links to next actions) is part of strict REST but rarely fully used in practice.`,
        followUps: ["Is an API that uses POST for everything RESTful?", "What is HATEOAS?", "How do caching headers fit into REST?"],
        commonMistake: "Saying 'REST means JSON over HTTP' and ignoring resources, statelessness and correct method semantics.",
        keywords: ["resources", "http methods", "stateless", "status codes"],
        difficulty: 1,
        roles: ["BACKEND", "FULLSTACK"],
      },
      {
        question: "Offset pagination vs cursor pagination — when do you use each?",
        short: "Offset pagination uses LIMIT and OFFSET; it is simple and allows jumping to any page but gets slow on deep pages and can skip or duplicate rows when data changes. Cursor pagination continues after the last seen key, which uses an index, stays fast and stable, but cannot jump to an arbitrary page.",
        deep: `- **Offset**: \`ORDER BY id LIMIT 20 OFFSET 4000\`. The DB still walks 4000 rows to throw them away. If a new row is inserted at the top while the user scrolls, page 2 repeats an item.
- **Cursor/keyset**: \`WHERE id < :lastId ORDER BY id DESC LIMIT 20\`. Uses the index directly; cost is the same for page 1 and page 10,000.
- Encode the cursor (e.g. base64 of \`createdAt,id\`) so clients treat it as opaque.
- Use offset for small admin tables with page numbers; use cursor for feeds, infinite scroll and large tables.`,
        followUps: ["How do you build a cursor when sorting by a non-unique column like createdAt?", "How would you return the total count efficiently?"],
        commonMistake: "Using a non-unique sort column alone as the cursor, which skips rows with equal values.",
        keywords: ["limit offset", "keyset", "index", "stable", "infinite scroll"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK", "SDE"],
      },
      {
        question: "How do you version a REST API and avoid breaking clients?",
        short: "Prefer additive, backward-compatible changes. When a breaking change is unavoidable, introduce a new version, commonly in the URL like /v2 or in a header, run both versions in parallel, announce deprecation, and remove the old one only after clients migrate.",
        deep: `- **Non-breaking**: adding an optional field, adding a new endpoint.
- **Breaking**: removing or renaming fields, changing types, making a field required, changing status codes.
- Strategies: URL versioning (\`/v1\`, \`/v2\`, easy to see and route), header versioning (\`Accept\` or a custom header, cleaner URLs), or date-based versions like Stripe.
- Use \`Deprecation\`/\`Sunset\` headers, track which clients still call old versions, and keep contract tests per version.`,
        followUps: ["Is adding a required request field a breaking change?", "How do you know when it is safe to delete v1?"],
        commonMistake: "Bumping the version for every small change instead of making additive changes.",
        keywords: ["backward compatible", "additive", "deprecation", "v2"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK"],
      },
    ],
    promptCard: {
      title: "Design REST endpoints for my feature",
      category: "SYSTEM_DESIGN",
      task: "Get a clean, consistent REST endpoint design (URLs, methods, payloads, errors, pagination) for a new feature before writing code.",
      whenToUse: "Before building a new module or when your existing endpoints feel messy and inconsistent.",
      template: `You are a senior backend engineer who designs clean REST APIs.

Feature: [FEATURE_DESCRIPTION]
Main entities and relationships: [ENTITIES]
Who calls this API: [CLIENTS]
Existing conventions to follow (naming, error format, auth): [CONVENTIONS]

Design the REST endpoints. For each endpoint give:
1. Method and URL (plural nouns, max 2 levels of nesting, version prefix)
2. Who is allowed to call it (authentication and ownership rules)
3. Request body / query params with types and validation rules
4. Success response shape and status code
5. Error cases with status codes, using one consistent error format

Also include: pagination strategy for list endpoints (with a max limit), filtering/sorting params, and any field that must NEVER appear in responses.
Point out anything in my requirements that is ambiguous instead of guessing.`,
      variables: [
        { key: "FEATURE_DESCRIPTION", label: "What the feature does, in 2–4 lines" },
        { key: "ENTITIES", label: "Entities and how they relate (e.g. user has many listings)" },
        { key: "CLIENTS", label: "Who calls it (web app, Android app, admin panel)" },
        { key: "CONVENTIONS", label: "Your current conventions, or 'none yet'" },
      ],
      whyItWorks: [
        { part: "Senior backend engineer role", why: "Pushes the answer toward production conventions instead of tutorial-style endpoints." },
        { part: "Per-endpoint checklist", why: "Forces auth, validation and errors to be designed up front, not bolted on later." },
        { part: "Fields that must never appear", why: "Makes data leakage (password hashes, internal flags) an explicit design question." },
        { part: "Ask about ambiguity", why: "Stops the model from inventing requirements you did not state." },
      ],
      verifyChecklist: [
        "URLs use nouns and methods carry the action",
        "Every list endpoint has pagination with a maximum limit",
        "Every endpoint states who may call it (ownership checks included)",
        "One error format is used everywhere",
        "No sensitive fields appear in response examples",
      ],
      sampleOutput: `POST /v1/listings → 201 { data: { id, title, price, createdAt } }
  Auth: logged-in user. Body: title (3–80 chars), price (integer 1–100000).
  Errors: 400 VALIDATION_FAILED, 401 UNAUTHENTICATED.
GET /v1/listings?category=&sort=-createdAt&limit=20&cursor= → 200 { data: [...], meta: { nextCursor } }
  limit max 50. Never return sellerPhone unless the viewer is the buyer of an accepted offer.
Ambiguity: can a listing be edited after it is sold?`,
    },
  },
  // ───────────────────────────── 3. Express middleware ─────────────────────────────
  {
    slug: "express-middleware",
    estMinutes: 40,
    difficulty: 2,
    prerequisites: ["js-functions", "http-methods-status", "express-routing"],
    objectives: [
      "Explain how a request flows through a middleware chain using next()",
      "Write logging, authentication and error-handling middleware",
      "Order middleware correctly (body parser, auth, routes, error handler)",
      "Debug requests that hang or skip middleware",
    ],
    technicalDefinition:
      "In Express, middleware are functions with the signature (req, res, next) that execute in registration order for matching requests; each can read or modify the request and response, end the response, or pass control to the next function by calling next(), while error-handling middleware has the signature (err, req, res, next).",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Middleware** ek function hai jo request aur final route handler ke **beech mein** chalta hai. Express mein iska shape hota hai \`(req, res, next)\`.

Har middleware ke paas teen options hain:
- Request ko dekhna/badalna (jaise \`req.user\` set karna) aur \`next()\` bulana — "aage jao".
- Khud response bhej dena (jaise \`res.status(401)\`) — chain yahin ruk jaati hai.
- Error mile to \`next(err)\` — seedha error handler pe jao.

Middleware ek line mein lagte hain, jis order mein tumne \`app.use()\` kiya. Logging, login check, JSON body parse karna, rate limit — ye sab kaam middleware karte hain, taaki har route mein same code baar-baar na likhna pade.`,
          en: `**Middleware** is a function that runs **between** the incoming request and the final route handler. In Express it looks like \`(req, res, next)\`.

Each middleware can:
- Read or change the request (for example set \`req.user\`) and call \`next()\` to continue.
- Send a response itself (for example \`res.status(401)\`), which stops the chain.
- Call \`next(err)\` to jump to the error handler.

Middleware runs in the order you register it with \`app.use()\`. Logging, auth checks, JSON parsing and rate limiting are all middleware, so routes do not repeat that code.`,
          hi: `**Middleware** एक function है जो request और अंतिम route handler के **बीच में** चलता है। Express में इसका रूप होता है \`(req, res, next)\`।

हर middleware के पास तीन विकल्प हैं:
- request को देखना या बदलना (जैसे \`req.user\` सेट करना) और \`next()\` बुलाना — "आगे जाओ"।
- खुद response भेज देना (जैसे \`res.status(401)\`) — श्रृंखला यहीं रुक जाती है।
- गलती मिले तो \`next(err)\` — सीधे error handler पर जाओ।

Middleware उसी क्रम में चलते हैं जिसमें आपने \`app.use()\` लिखा। Logging, login जाँच, JSON पढ़ना — ये सब middleware करते हैं।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Airport** socho. Tum flight tak seedha nahi pahunchte — beech mein checkpoints hain:

1. Gate pe CISF ticket + ID dekhta hai (**auth middleware**). ID nahi hai? Wahin rok diya — aage jaana band (\`res.status(401)\`).
2. Check-in counter bag tolta hai aur tag lagata hai (**body parser** — saamaan ko kaam ke format mein badalna).
3. Security scan (**validation / rate limit**).
4. Har checkpoint register mein entry karta hai (**logger**).
5. Aakhir mein boarding gate (**route handler**) — yahan asli kaam.

Har checkpoint ya to bolta hai "theek hai, aage jao" (\`next()\`) ya "yahin ruko" (response bhej do). Agar kahin problem hui to tumhe seedha **help desk** bheja jaata hai (\`next(err)\` → error handler). Checkpoints ka **order** important hai — boarding ke baad security check ka koi matlab nahi!`,
          en: `Think of an **airport**. You do not walk straight to the plane; there are checkpoints:

1. At the gate, security checks your ticket and ID (**auth middleware**). No ID? You are stopped there (\`res.status(401)\`).
2. Check-in weighs and tags your bag (**body parser**).
3. A security scan (**validation, rate limiting**).
4. Every checkpoint writes in a register (**logger**).
5. Finally the boarding gate (**route handler**) does the real work.

Each checkpoint either says "go ahead" (\`next()\`) or "stop here" (send a response). Problems send you to the **help desk** (\`next(err)\`). The **order** of checkpoints matters.`,
          hi: `एक **हवाई अड्डा** सोचिए। आप सीधे विमान तक नहीं पहुँचते — बीच में जाँच चौकियाँ हैं:

1. गेट पर सुरक्षाकर्मी टिकट और पहचान पत्र देखता है (**auth middleware**)। पहचान पत्र नहीं? वहीं रोक दिया गया।
2. चेक-इन काउंटर बैग तौलता है (**body parser**)।
3. सुरक्षा जाँच (**validation**)।
4. हर चौकी रजिस्टर में एंट्री करती है (**logger**)।
5. अंत में बोर्डिंग गेट (**route handler**) — यहाँ असली काम होता है।

हर चौकी या तो कहती है "आगे जाइए" (\`next()\`) या "यहीं रुकिए" (response)। समस्या होने पर आपको **हेल्प डेस्क** भेजा जाता है (\`next(err)\`)। चौकियों का **क्रम** बहुत ज़रूरी है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Socho tumhari API mein 40 routes hain aur sab mein login check chahiye. Bina middleware ke har route ke andar ye likhna padega:

\`\`\`js
const token = req.headers.authorization;
if (!token) return res.status(401).json({ error: "Login required" });
\`\`\`

40 jagah copy-paste. Ek jagah bhool gaye → **security hole**. Logic badalna ho to 40 files edit.

Middleware se ye kaam **ek jagah** likho aur sab routes pe lagao. Fayde:
- **DRY**: logging, auth, CORS, body parsing — ek baar.
- **Separation**: route handler sirf business logic dekhta hai ("order banao"), cross-cutting kaam middleware sambhalte hain.
- **Central error handling**: sab errors ek handler mein, ek format mein.
- **Reuse**: \`helmet\`, \`cors\`, \`express-rate-limit\` jaise ready-made packages bas \`app.use()\` se lag jaate hain.`,
          en: `Imagine 40 routes that all need a login check. Without middleware you copy the same token check into every route. Forget it once and you have a **security hole**; change the logic and you edit 40 places.

Middleware lets you write it **once** and apply it everywhere:
- **DRY**: logging, auth, CORS and body parsing live in one place.
- **Separation**: route handlers focus on business logic.
- **Central error handling**: one handler, one error format.
- **Reuse**: packages like \`helmet\`, \`cors\` and \`express-rate-limit\` plug in with \`app.use()\`.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Middleware pattern sirf Express mein nahi, bahut jagah hai:

- **Express apps (jaise kai startups ke Node backends)**: \`app.use(express.json())\`, \`app.use(cors())\`, \`app.use(helmet())\`, phir auth middleware jo JWT verify karke \`req.user\` set karta hai.
- **Next.js**: \`middleware.ts\` file har request se pehle chalti hai — logged-in nahi ho to \`/login\` pe redirect, ya country ke hisaab se rewrite.
- **Django / FastAPI**: Django mein \`MIDDLEWARE\` list hoti hai (sessions, CSRF, auth). FastAPI mein \`@app.middleware("http")\` se timing ya request-id add karte hain.
- **API gateways (jaise Kong, AWS API Gateway)**: rate limiting, API key check — ye bhi basically bade level pe middleware hi hai, servers tak pahunchne se pehle.

Concept same: request ko chain se guzaaro, har step ek chhota kaam kare.`,
          en: `The middleware pattern appears in many places:

- **Express apps** commonly use \`express.json()\`, \`cors()\`, \`helmet()\` and an auth middleware that verifies a JWT and sets \`req.user\`.
- **Next.js** runs \`middleware.ts\` before requests, for example to redirect logged-out users to \`/login\`.
- **Django and FastAPI** have middleware lists or decorators for sessions, CSRF, timing and request IDs.
- **API gateways** like Kong apply rate limits and API key checks before traffic reaches your servers.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Express andar se ek **array of functions** rakhta hai (stack). Request aane pe:

1. Index \`i = 0\` se shuru. Function \`next()\` banata hai jo \`stack[i++]\` ko call karta hai.
2. Har layer check karti hai — path match karta hai? (\`app.use("/admin", ...)\` sirf \`/admin\` pe). Match nahi to skip.
3. Middleware \`next()\` bulaye → agla function. Response bheje → chain khatam.
4. \`next(err)\` bulaya → Express normal middleware **skip** karta hai aur pehla aisa function dhundhta hai jiske **4 parameters** hain \`(err, req, res, next)\`. Haan, Express \`fn.length\` dekh ke pehchanta hai!
5. Koi bhi response na bheje aur stack khatam → Express ka default **404** handler.

Important: agar middleware na \`next()\` bulaye na response bheje, request **latak jaati hai** — client timeout tak wait karta rahega. Express 5 mein async function se throw hua error bhi apne aap \`next(err)\` ban jaata hai; Express 4 mein manually pakadna padta tha.`,
          en: `Express keeps a **stack** (array) of functions. For each request:

1. It starts at index 0 and builds a \`next()\` that calls \`stack[i++]\`.
2. Each layer checks if its path matches; if not, it is skipped.
3. If a middleware calls \`next()\`, the next one runs; if it sends a response, the chain ends.
4. \`next(err)\` skips normal middleware and finds the first function with **four parameters** \`(err, req, res, next)\`; Express checks \`fn.length\`.
5. If nothing responds, Express's default **404** handler runs.

If a middleware neither calls \`next()\` nor responds, the request **hangs**. Express 5 forwards rejected promises from async handlers automatically.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yahan humne **Express ka mini version** banaya hai — koi server nahi, bas stack + \`next()\`:

- \`createApp()\` ek \`stack\` array rakhta hai; \`use(fn)\` usme function daalta hai.
- \`handle(req)\` ke andar \`next(err)\`: agla function nikalo. Error hai to sirf 4-argument wale (error handler) chalao, baaki skip.
- \`logger\` har request ka method + path log karta hai.
- \`auth\` token check karta hai; galat to \`401\` aur chain khatam (\`next\` nahi bulaya).
- \`route\` asli kaam karta hai; \`/boom\` pe jaan-boojhke error throw karta hai.
- \`errorHandler\` sab errors ko \`500\` + safe message mein badalta hai.

Teen requests chalake dekho: ek sahi token wali, ek bina token, aur ek jo error throw karti hai. Output mein har middleware ka order saaf dikhega.`,
          en: `This is a **mini Express** with no server, just a stack and \`next()\`:

- \`createApp()\` keeps a \`stack\`; \`use(fn)\` adds to it.
- \`next(err)\` takes the next function; when there is an error, only four-argument error handlers run.
- \`logger\` logs method and path.
- \`auth\` checks the token and responds \`401\` without calling \`next\` if it is wrong.
- \`route\` does the work and throws on \`/boom\`.
- \`errorHandler\` turns errors into a safe \`500\`.

Run three requests and watch the order in the output.`,
        },
        codeJs: `function createApp() {
  const stack = [];
  return {
    use(fn) { stack.push(fn); },
    handle(req) {
      const res = { status: 200, body: null, ended: false };
      res.send = (status, body) => { res.status = status; res.body = body; res.ended = true; };
      let i = 0;
      function next(err) {
        if (res.ended) return;
        const fn = stack[i++];
        if (!fn) { if (!res.ended) res.send(404, "Not found"); return; }
        const isErrorHandler = fn.length === 4;
        if (err) return isErrorHandler ? fn(err, req, res, next) : next(err);
        if (isErrorHandler) return next();
        try { fn(req, res, next); } catch (e) { next(e); }
      }
      next();
      return res;
    },
  };
}

const app = createApp();
app.use(function logger(req, res, next) { console.log("  [log] " + req.method + " " + req.path); next(); });
app.use(function auth(req, res, next) {
  if (req.token !== "secret-123") return res.send(401, "Login required");
  req.user = { id: 7 };
  next();
});
app.use(function route(req, res, next) {
  if (req.path === "/boom") throw new Error("DB connection lost");
  res.send(200, "Orders of user " + req.user.id);
});
app.use(function errorHandler(err, req, res, next) {
  console.log("  [error] " + err.message);
  res.send(500, "Something went wrong");
});

for (const req of [
  { method: "GET", path: "/orders", token: "secret-123" },
  { method: "GET", path: "/orders" },
  { method: "GET", path: "/boom", token: "secret-123" },
]) {
  const res = app.handle(req);
  console.log(req.path + " -> " + res.status + " " + res.body);
}
`,
        codePython: `class App:
    def __init__(self):
        self.stack = []

    def use(self, fn, error_handler=False):
        self.stack.append((fn, error_handler))

    def handle(self, req):
        res = {"status": 200, "body": None, "ended": False}

        def send(status, body):
            res.update(status=status, body=body, ended=True)

        res["send"] = send
        index = {"i": 0}

        def next_(err=None):
            if res["ended"]:
                return
            if index["i"] >= len(self.stack):
                send(404, "Not found")
                return
            fn, is_error_handler = self.stack[index["i"]]
            index["i"] += 1
            if err is not None:
                return fn(err, req, res, next_) if is_error_handler else next_(err)
            if is_error_handler:
                return next_()
            try:
                fn(req, res, next_)
            except Exception as e:
                next_(e)

        next_()
        return res


app = App()


def logger(req, res, next_):
    print(f"  [log] {req['method']} {req['path']}")
    next_()


def auth(req, res, next_):
    if req.get("token") != "secret-123":
        return res["send"](401, "Login required")
    req["user"] = {"id": 7}
    next_()


def route(req, res, next_):
    if req["path"] == "/boom":
        raise RuntimeError("DB connection lost")
    res["send"](200, f"Orders of user {req['user']['id']}")


def error_handler(err, req, res, next_):
    print(f"  [error] {err}")
    res["send"](500, "Something went wrong")


app.use(logger)
app.use(auth)
app.use(route)
app.use(error_handler, error_handler=True)

for req in [
    {"method": "GET", "path": "/orders", "token": "secret-123"},
    {"method": "GET", "path": "/orders"},
    {"method": "GET", "path": "/boom", "token": "secret-123"},
]:
    res = app.handle(req)
    print(f"{req['path']} -> {res['status']} {res['body']}")
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Ye galtiyan har Express beginner karta hai:

- **\`next()\` bhool jaana**: middleware ne kaam kiya par \`next()\` nahi bulaya → request latki rahi, Postman ghoomta raha.
- **Response ke baad bhi \`next()\`**: \`res.status(401).json(...)\` ke baad \`return\` nahi lagaya → aage ka code bhi chala → "Cannot set headers after they are sent" error.
- **Galat order**: \`express.json()\` routes ke **baad** lagaya → \`req.body\` undefined. Ya auth middleware routes ke baad → routes bina login khul gaye!
- **Error handler 3 arguments ke saath**: \`(err, req, res)\` likha → Express use error handler maanta hi nahi. 4 arguments zaroori.
- **Error handler beech mein**: error handler hamesha **sabse last** mein lagao.
- **Async errors Express 4 mein**: \`async\` handler mein throw hua error pakda nahi gaya → unhandled rejection. try/catch + \`next(err)\` karo ya Express 5 use karo.`,
          en: `Classic Express mistakes:

- **Forgetting \`next()\`**, so the request hangs.
- **Not returning after sending a response**, causing "Cannot set headers after they are sent".
- **Wrong order**: \`express.json()\` after routes leaves \`req.body\` undefined; auth after routes leaves them unprotected.
- **Error handler with three arguments**: Express only treats four-argument functions as error handlers.
- **Error handler not last**.
- **Async errors in Express 4** not passed to \`next(err)\`.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Middleware bugs kaise pakdein:

1. **Request hang ho rahi hai?** Har middleware ke start mein ek log daalo: \`console.log("auth start")\`. Jahan log ruk jaaye, wahi middleware \`next()\` bhool raha hai.
2. **"Cannot set headers after they are sent"**: kahin response do baar bheja ja raha hai. Har \`res.json()\` / \`res.send()\` ke aage \`return\` lagao.
3. **\`req.body\` undefined**: check karo \`app.use(express.json())\` routes se pehle hai, aur client \`Content-Type: application/json\` bhej raha hai.
4. **Error handler chal hi nahi raha**: signature mein 4 params hain? Aur woh routes ke baad registered hai?
5. **Order dekhna ho** to ek request-id middleware sabse pehle lagao:

\`\`\`js
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  console.log(req.id, req.method, req.url);
  next();
});
\`\`\`

Har log line mein \`req.id\` daalo — ek request ki poori journey trace ho jaayegi.`,
          en: `Debugging middleware:

1. **Hanging request**: log at the start of each middleware; where logs stop, that middleware forgot \`next()\`.
2. **"Cannot set headers after they are sent"**: a response is sent twice; add \`return\` before \`res.json()\`.
3. **\`req.body\` undefined**: register \`express.json()\` before routes and send \`Content-Type: application/json\`.
4. **Error handler never runs**: check it has four parameters and is registered last.
5. Add a **request-id middleware** first and include the id in every log line to trace one request end to end.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Middleware powerful hai, par har cheez middleware mein mat thoso:

- **Global middleware har request pe chalta hai**: agar tumne global middleware mein DB query daali (jaise "user ka full profile load karo"), to \`/health\` jaise simple route bhi slow ho jaayenge. Heavy kaam sirf zaroori routes pe lagao (router-level middleware).
- **Hidden magic**: bahut saare middleware jo \`req\` pe cheezein chipkaate hain (\`req.user\`, \`req.tenant\`, \`req.cart\`) — naya developer confuse hota hai ki ye aaya kahan se. Clear naming aur TypeScript types rakho.
- **Business logic middleware mein nahi**: "order ka discount calculate karo" route/service mein jaana chahiye, middleware mein nahi.
- **Alternatives**: kuch kaam API gateway ya reverse proxy (Nginx) pe better hain — jaise global rate limit ya TLS. FastAPI mein bahut kuch **dependencies** (\`Depends\`) se hota hai jo per-route aur testable hain.`,
          en: `Do not put everything into middleware:

- **Global middleware runs on every request**, so a DB query there slows even \`/health\`. Apply heavy middleware only to routes that need it.
- **Hidden magic**: many middlewares attaching fields to \`req\` confuse new developers; name things clearly and type them.
- **Business logic** belongs in routes or services, not middleware.
- **Alternatives**: gateways or Nginx can handle global rate limits and TLS; FastAPI uses per-route **dependencies** (\`Depends\`) that are easy to test.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek production Express app ka typical setup kuch aisa hota hai:

\`\`\`js
app.use(requestId);            // har request ko id do
app.use(helmet());             // security headers
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);        // method, path, time, status
app.use("/api", rateLimiter);
app.use("/api/auth", authRoutes);          // login/signup: bina token
app.use("/api", requireAuth, apiRoutes);   // baaki sab: token zaroori
app.use(notFoundHandler);      // 404 JSON
app.use(errorHandler);         // sabse last
\`\`\`

Dekho kaise **order** soch-samajh ke rakha gaya hai: body limit se bada payload pehle hi reject, login routes bina auth ke, baaki sab \`requireAuth\` ke peeche, aur error handler last. Code review mein log isi order ko check karte hain.`,
          en: `A typical production Express setup registers, in order: request id, \`helmet()\` security headers, \`cors()\` with allowed origins, \`express.json({ limit: "1mb" })\`, a request logger, a rate limiter on \`/api\`, public auth routes, then \`requireAuth\` in front of all other API routes, a 404 handler and finally the error handler.

The **order** is deliberate: oversized bodies are rejected early, login routes are public, everything else needs a token, and errors are handled last in one place. Reviewers check exactly this order.`,
        },
      },
    ],
    visualization: {
      kind: "FLOW",
      title: "A request through the middleware chain",
      steps: [
        { title: "Request arrives", description: "GET /api/orders with an Authorization header reaches Express.", highlight: "GET /api/orders" },
        { title: "Logger", description: "Logs method, path and a request id, then calls next().", highlight: "next()" },
        { title: "Body parser", description: "express.json() turns the raw body into req.body and calls next().", highlight: "req.body" },
        { title: "Auth middleware", description: "Verifies the token. If invalid it sends 401 and the chain stops; if valid it sets req.user and calls next().", highlight: "401 or req.user" },
        { title: "Route handler", description: "Loads orders for req.user.id and sends 200. If it throws, control jumps with next(err).", highlight: "res.json()" },
        { title: "Error handler (last)", description: "The (err, req, res, next) function logs the error and returns a safe 500 JSON.", highlight: "(err, req, res, next)" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "A middleware does some work but neither calls next() nor sends a response. What happens?",
        options: ["Express automatically calls the next middleware", "The request hangs until the client times out", "Express returns 500", "The route handler runs anyway"],
        correct: [1],
        explanation: "Express khud aage nahi badhta. Na \`next()\`, na response → request **latak jaati hai** aur client timeout tak wait karta hai.",
        tags: ["next"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "How does Express recognise an error-handling middleware?",
        options: ["Its name contains 'error'", "It is registered with app.error()", "It has exactly four parameters (err, req, res, next)", "It returns a Promise"],
        correct: [2],
        explanation: "Express function ka \`length\` dekhta hai. **4 parameters** = error handler. Isliye \`next\` use na karo tab bhi signature mein likhna padta hai.",
        tags: ["error-handling"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Where should `app.use(express.json())` be registered?",
        options: ["After all routes", "Before the routes that read req.body", "Only inside the error handler", "It does not matter"],
        correct: [1],
        explanation: "Middleware order mein chalta hai. Routes se pehle body parse nahi hui to route ko \`req.body\` **undefined** milega.",
        tags: ["order"],
      },
      {
        type: "MULTI",
        difficulty: 1,
        prompt: "Which of these are typical jobs for middleware? (Select all that apply)",
        options: ["Logging every request", "Checking the auth token and setting req.user", "Parsing JSON request bodies", "Running database migrations on every request"],
        correct: [0, 1, 2],
        explanation: "Logging, auth aur body parsing classic cross-cutting kaam hain. Har request pe migration chalana bilkul galat hai — wo deploy time pe ek baar hota hai.",
        tags: ["use-cases"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 3,
        prompt: "This mini middleware runner is called with a request that has no user. What does it print?",
        code: `const log = [];
const stack = [
  (req, next) => { log.push("A1"); next(); log.push("A2"); },
  (req, next) => { log.push("B"); if (req.user) next(); },
  (req, next) => { log.push("C"); },
];
function run(req) {
  let i = 0;
  const next = () => { const fn = stack[i++]; if (fn) fn(req, next); };
  next();
}
run({ user: null });
console.log(log.join(" "));`,
        codeLanguage: "javascript",
        options: ["A1 B C A2", "A1 B A2", "A1 A2 B", "A1 B"],
        correct: [1],
        explanation: "A1 log hua, phir \`next()\` ne B chalaya. B ne user nahi dekha to \`next()\` nahi bulaya — C kabhi nahi chala. Phir control wapas pehle middleware mein aaya aur **A2** log hua (next() ke baad wala code bhi chalta hai).",
        tags: ["next", "order"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "Your POST /api/products route always sees req.body as undefined, even though Postman sends JSON. What do you check first?",
        options: [
          "Restart the database",
          "Whether express.json() is registered before the route and the request has Content-Type: application/json",
          "Change the route to GET",
          "Add a second error handler",
        ],
        correct: [1],
        explanation: "\`req.body\` body-parser middleware set karta hai. Ya to wo route ke baad laga hai, ya client ne \`Content-Type\` header nahi bheja, isliye parser ne body ko JSON nahi maana.",
        tags: ["debugging"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Put this Express app's middleware in the correct registration order.",
        options: [
          "Request logger",
          "express.json() body parser",
          "Authentication middleware (requireAuth)",
          "Route handlers",
          "Error-handling middleware",
        ],
        explanation: "Pehle log (taaki har request dikhe), phir body parse, phir auth, phir routes, aur error handler **sabse last** taaki upar ke sab errors use mil sakein.",
        tags: ["order"],
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Why must the error-handling middleware be registered after all routes, and how do errors reach it?",
        keywords: ["last", "next(err)", "four arguments", "skip", "routes"],
        explanation: "Express \`next(err)\` milne pe aage ke normal middleware **skip** karta hai aur agla 4-argument function dhundhta hai. Agar error handler routes se pehle hai to routes ke errors usse kabhi nahi milenge — isliye last mein.",
        tags: ["error-handling"],
      },
    ],
    buildTask: {
      title: "Simulate a middleware pipeline",
      description: `Express ka chain khud simulate karo. Likho \`runMiddleware(stack, req)\` jahan \`stack\` middleware ke **naam** ki list hai. Return karo \`{ status, log }\`.

Har naam ka behaviour:
- \`"logger"\` → log mein \`"logger"\` daalo, aage badho.
- \`"auth"\` → agar \`req.token\` missing/empty hai: log \`"auth:fail"\`, status **401**, **ruk jao**. Warna log \`"auth:ok"\`, aage badho.
- \`"rateLimit"\` → agar \`req.requestCount\` (missing ho to 0) **5 se zyada** hai: log \`"rateLimit:block"\`, status **429**, ruk jao. Warna log \`"rateLimit:ok"\`, aage.
- \`"handler"\` → log \`"handler"\`, status **200**, ruk jao.

Agar poora stack chal gaya aur kisi ne response nahi bheja → status **404**.`,
      functionName: "runMiddleware",
      starterJs: `function runMiddleware(stack, req) {
  const log = [];
  // walk through stack, stop when a middleware "responds"
  return { status: 404, log };
}
`,
      starterPython: `def runMiddleware(stack, req):
    log = []
    # walk through stack, stop when a middleware "responds"
    return {"status": 404, "log": log}
`,
      tests: [
        { name: "happy path", args: [["logger", "auth", "handler"], { token: "abc" }], expected: { status: 200, log: ["logger", "auth:ok", "handler"] } },
        { name: "auth stops the chain", args: [["logger", "auth", "handler"], {}], expected: { status: 401, log: ["logger", "auth:fail"] } },
        { name: "rate limited", args: [["logger", "rateLimit", "auth", "handler"], { token: "abc", requestCount: 9 }], expected: { status: 429, log: ["logger", "rateLimit:block"] } },
        { name: "no handler means 404", args: [["logger", "auth"], { token: "abc" }], expected: { status: 404, log: ["logger", "auth:ok"] } },
        { name: "exactly 5 requests allowed", args: [["rateLimit", "handler"], { requestCount: 5 }], expected: { status: 200, log: ["rateLimit:ok", "handler"] } },
        { name: "empty token fails auth", args: [["auth", "handler"], { token: "" }], expected: { status: 401, log: ["auth:fail"] }, hidden: true },
        { name: "handler before auth runs first", args: [["handler", "auth"], {}], expected: { status: 200, log: ["handler"] }, hidden: true },
      ],
      hints: [
        "Middleware chain = loop over the stack. Har step ya to aage badhta hai ya response deke loop tod deta hai.",
        "for loop chalao. Har naam ke liye if/else. Jo middleware 'respond' karta hai wahan status set karke turant return { status, log } karo. Loop khatam hone pe 404.",
        "JS: for (const name of stack) { if (name === \"auth\") { if (!req.token) { log.push(\"auth:fail\"); return { status: 401, log }; } log.push(\"auth:ok\"); } /* ... */ } return { status: 404, log };",
      ],
      explainQuestions: [
        { question: "Why does putting 'handler' before 'auth' in the stack let unauthenticated requests through?", keywords: ["order", "before", "stops", "never runs"] },
        { question: "How does your function stop the chain when a middleware responds?", keywords: ["return", "early", "loop", "status"] },
        { question: "What security problem happens in a real app if auth middleware is registered after the routes? (security)", keywords: ["unprotected", "bypass", "order", "authentication"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "What is middleware in Express and how does next() work?",
        short: "Middleware are functions with (req, res, next) that run in registration order for matching requests. Each can modify req/res, end the response, or call next() to pass control to the next function. Calling next(err) skips to the error-handling middleware.",
        deep: `- Express stores middleware and routes in a stack; \`next\` is a closure that advances an index and calls the next matching layer.
- Code after \`next()\` still runs when downstream returns (synchronously), which is how timing middleware works.
- Application-level (\`app.use\`), router-level (\`router.use\`), route-specific (\`app.get("/x", auth, handler)\`), built-in (\`express.json\`), third-party (\`cors\`, \`helmet\`) and error-handling middleware exist.
- If no one responds, the request hangs; if the stack ends, Express's final handler sends 404.`,
        followUps: ["How would you measure request duration in middleware?", "How do you apply middleware to only one router?", "What happens if you call next() after sending a response?"],
        commonMistake: "Not returning after sending a response, causing 'headers already sent' errors.",
        keywords: ["req res next", "order", "next(err)", "chain"],
        difficulty: 1,
        roles: ["BACKEND", "FULLSTACK"],
      },
      {
        question: "How do you handle errors centrally in Express, including async errors?",
        short: "Register one error-handling middleware with four parameters after all routes. Route code calls next(err) or throws; in Express 5 rejected promises from async handlers are forwarded automatically, while in Express 4 you wrap handlers or use try/catch and next(err). The handler logs details and returns a safe, consistent JSON error.",
        deep: `- Define custom error classes (e.g. \`NotFoundError\` with \`status = 404\`) so the handler maps them to status codes.
- In the handler: log with request id and stack trace; respond with \`{ error: { code, message } }\`; never send stack traces in production.
- Express 4: \`const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);\`
- Also handle \`unhandledRejection\` / \`uncaughtException\` at process level for crashes outside requests.`,
        followUps: ["How do you avoid leaking internal error messages?", "How do you return 404 for unknown routes?"],
        commonMistake: "Writing the error handler with three parameters so Express treats it as normal middleware.",
        keywords: ["four parameters", "after routes", "async", "safe message"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK"],
      },
    ],
  },
  // ───────────────────────────── 4. Input validation ─────────────────────────────
  {
    slug: "input-validation",
    estMinutes: 40,
    difficulty: 2,
    prerequisites: ["express-middleware", "http-methods-status", "json-basics"],
    objectives: [
      "Validate type, presence, length, format and range of every input on the server",
      "Use an allowlist schema and strip unknown fields to prevent mass assignment",
      "Return clear 400/422 errors with per-field messages",
      "Explain why validation alone does not replace parameterised queries and output encoding",
    ],
    technicalDefinition:
      "Input validation is the server-side process of checking that untrusted data (body, query, params, headers, files) conforms to an expected schema — type, presence, length, format, range and allowed values — and rejecting or normalising it before it reaches business logic or storage.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Input validation** matlab: server pe aane wale har data ko check karna ki wo **waisa hi hai jaisa hum expect karte hain** — tabhi aage use karna.

Check kya karte hain:
- **Presence**: required field hai ya nahi (\`email\` missing?).
- **Type**: \`age\` number hai ya \`"twenty"\` string?
- **Length**: naam 2–50 characters?
- **Format**: email jaisa dikhta hai? phone 10 digit?
- **Range / enum**: \`quantity\` 1–20? \`status\` sirf \`"pending" | "paid"\`?

Golden rule: **client se aaya har data untrusted hai** — body, query, URL params, headers, files. Frontend validation sirf user ki suvidha ke liye hai; asli suraksha **server-side validation** hai.`,
          en: `**Input validation** means checking that every piece of data reaching your server **looks exactly as expected** before using it.

You check:
- **Presence**: is the required field there?
- **Type**: is \`age\` a number, not \`"twenty"\`?
- **Length**: is the name 2 to 50 characters?
- **Format**: does the email look valid?
- **Range or allowed values**: is \`quantity\` between 1 and 20?

Golden rule: **all client data is untrusted**, including body, query, params, headers and files. Frontend checks are for convenience; real protection is **server-side validation**.`,
          hi: `**इनपुट वैलिडेशन** का मतलब है: सर्वर पर आने वाले हर डेटा को जाँचना कि वह **बिल्कुल वैसा ही है जैसा हम चाहते हैं** — तभी उसे आगे इस्तेमाल करना।

क्या जाँचते हैं:
- **मौजूदगी**: ज़रूरी field है या नहीं?
- **प्रकार**: \`age\` संख्या है या \`"twenty"\`?
- **लंबाई**: नाम 2 से 50 अक्षर?
- **फ़ॉर्मेट**: ईमेल सही दिखता है?
- **सीमा**: \`quantity\` 1 से 20 के बीच?

सुनहरा नियम: **client से आया हर डेटा अविश्वसनीय है**। फ्रंटएंड जाँच सिर्फ़ सुविधा के लिए है; असली सुरक्षा **सर्वर पर जाँच** है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Bank ka cheque counter** socho. Cashier cheque lete hi paise nahi de deta. Pehle check karta hai:

- Date sahi hai? (format)
- Amount words aur number mein same hai? (consistency)
- Signature hai? (required field)
- Amount account ki limit ke andar? (range)
- Cheque pe koi extra line to nahi joda — "aur mujhe manager bana do"? (unknown fields — reject!)

Ek bhi cheez galat → cheque wapas, saath mein **clear reason**: "Amount in words missing". Cashier ye nahi sochta ki "customer ne ghar pe check kiya hoga". Ghar pe check karna (frontend validation) achha hai, par bank apni jaanch **khud** karta hai.

API bhi wahi cashier hai — har request ek cheque hai.`,
          en: `Think of a **bank cheque counter**. The cashier does not pay immediately. First they check:

- Is the date valid? (format)
- Do the amount in words and numbers match? (consistency)
- Is it signed? (required field)
- Is the amount within the limit? (range)
- Did someone add an extra line like "also make me manager"? (unknown field, reject)

If anything is wrong, the cheque is returned with a **clear reason**. The cashier never assumes the customer checked it at home. Your API is that cashier; every request is a cheque.`,
          hi: `**बैंक का चेक काउंटर** सोचिए। कैशियर चेक लेते ही पैसे नहीं दे देता। पहले जाँचता है:

- तारीख सही है? (फ़ॉर्मेट)
- अंकों और शब्दों में राशि एक जैसी है?
- हस्ताक्षर है? (ज़रूरी field)
- राशि सीमा के अंदर है? (रेंज)
- किसी ने कोई अतिरिक्त पंक्ति तो नहीं जोड़ी? (अनजान field — अस्वीकार)

एक भी चीज़ गलत → चेक वापस, साथ में **साफ़ कारण**। कैशियर यह नहीं मानता कि ग्राहक ने घर पर जाँच की होगी। आपकी API भी वही कैशियर है — हर request एक चेक है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Bina validation ke kya-kya ho sakta hai:

- **Crash**: \`age: "twenty"\` aaya, code ne \`age + 1\` kiya, DB ne type error diya → **500** aur user confused.
- **Kharab data**: \`quantity: -5\` se order total negative — paise wapas dene pad gaye!
- **Mass assignment**: user ne signup body mein \`"role": "admin"\` daal diya, aur tumne poora \`req.body\` DB mein save kar diya → wo admin ban gaya.
- **Injection**: unchecked string seedha SQL ya shell command mein gayi.
- **DoS**: 50 MB ka "name" bheja, server ki memory khatam.

Frontend validation bypass karna bahut aasaan hai — \`curl\` ya Postman se seedha API call. Isliye OWASP bhi bolta hai: har trust boundary pe validate karo. Validation se errors **jaldi aur saaf** pakde jaate hain, 400 ke saath, na ki baad mein DB ke andar.`,
          en: `Without validation:

- **Crashes**: \`age: "twenty"\` causes a type error and a **500**.
- **Bad data**: \`quantity: -5\` creates a negative order total.
- **Mass assignment**: a signup body with \`"role": "admin"\` is saved as-is and the user becomes admin.
- **Injection**: unchecked strings reach SQL or shell commands.
- **DoS**: a 50 MB "name" exhausts memory.

Frontend checks are trivially bypassed with \`curl\`. Validating at every trust boundary catches problems **early and clearly** with a 400.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Real duniya mein validation kaise dikhta hai:

- **FastAPI**: Pydantic models se har request body automatically validate hoti hai. Galat type bheja to FastAPI khud **422** + field-wise error list lauta deta hai. Isliye Python backends mein ye bahut popular hai.
- **Node/Express apps**: \`zod\`, \`joi\` ya \`express-validator\` jaisi libraries se schema banake middleware mein \`schema.parse(req.body)\` karte hain. tRPC aur Next.js server actions mein zod common hai.
- **Payment/fintech APIs (jaise Razorpay, Stripe)**: amount ko integer smallest unit (paise/cents) mein maangte hain, currency ek fixed list se, aur galat param pe clear error message dete hain jisme field ka naam hota hai.
- **Government forms (jaise PAN/Aadhaar based)**: format checks — PAN ka fixed pattern, pincode 6 digit.`,
          en: `How validation shows up in practice:

- **FastAPI** validates request bodies with Pydantic models and automatically returns **422** with per-field errors.
- **Express apps** commonly use \`zod\`, \`joi\` or \`express-validator\` in middleware; zod is also common in tRPC and Next.js server actions.
- **Payment APIs like Razorpay and Stripe** expect amounts as integers in the smallest unit (paise or cents), currencies from a fixed list, and return errors naming the bad field.
- **Government-style forms** check fixed formats such as a PAN pattern or a 6-digit pincode.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Validation layer andar se aise kaam karti hai:

1. **Parse**: raw body → JSON object (\`express.json()\`). Body size limit yahin lagti hai.
2. **Schema match**: har field ke rules ek-ek karke chalte hain — required? type? length? pattern? range?
3. **Errors collect**: pehli galti pe rukne ke bajaye saari galtiyan ek list mein jama karo, taaki user ek baar mein sab theek kare.
4. **Strip / reject unknown fields**: schema mein jo field nahi hai (\`role\`, \`isAdmin\`) use hata do — ise **allowlist** approach kehte hain.
5. **Normalise**: \`email.trim().toLowerCase()\`, string "5" ko number 5 (sirf jab safe ho).
6. **Result**: errors hain → \`400/422\` with \`{ errors: [{ field, message }] }\`. Nahi hain → saaf, typed object handler ko milta hai.

Zod mein ye sab ek line: \`const data = SignupSchema.parse(req.body)\`. Handler sirf \`data\` use kare, kabhi raw \`req.body\` nahi.`,
          en: `Inside a validation layer:

1. **Parse** the raw body into JSON, enforcing a size limit.
2. **Match the schema**: required, type, length, pattern, range for each field.
3. **Collect all errors** instead of stopping at the first, so the user fixes everything at once.
4. **Strip or reject unknown fields** (the allowlist approach).
5. **Normalise**, for example trimming and lowercasing email.
6. Return \`400/422\` with per-field errors, or pass a clean typed object to the handler.

With zod: \`const data = SignupSchema.parse(req.body)\`, and the handler only uses \`data\`.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yahan ek **mini schema validator** hai (zod/Pydantic ka chhota bhai):

- \`schema\` mein har field ke rules: \`type\`, \`required\`, \`min\`/\`max\` (string ke liye length, number ke liye value), \`oneOf\`, \`email\`.
- \`validate(schema, body)\` har field pe rules chalata hai aur saari errors ek list mein jama karta hai.
- Jo field schema mein **nahi** hai (jaise \`role\`), wo \`clean\` object mein copy hi nahi hota — mass assignment khatam.
- \`isEmail\` simple check karta hai: ek \`@\`, dono taraf kuch, domain mein dot, koi space nahi.

Teen bodies test kiye hain: ek sahi, ek galat types wali, aur ek jo chupke se \`role: "admin"\` bhej rahi hai. Output mein dekho — attacker ka \`role\` gayab ho gaya.`,
          en: `This is a **mini schema validator**, a tiny cousin of zod or Pydantic:

- \`schema\` lists rules per field: \`type\`, \`required\`, \`min\`/\`max\`, \`oneOf\`, \`email\`.
- \`validate\` runs every rule and collects all errors.
- Fields not in the schema (like \`role\`) are never copied into \`clean\`, which blocks mass assignment.
- \`isEmail\` is a simple check: one \`@\`, text on both sides, a dot in the domain, no spaces.

Three bodies are tested; notice the attacker's \`role\` disappears.`,
        },
        codeJs: `function isEmail(s) {
  if (s.includes(" ")) return false;
  const parts = s.split("@");
  if (parts.length !== 2 || !parts[0]) return false;
  const domain = parts[1].split(".");
  return domain.length >= 2 && domain.every((d) => d.length > 0);
}

const schema = {
  name: { type: "string", required: true, min: 2, max: 50 },
  email: { type: "string", required: true, email: true },
  plan: { type: "string", required: false, oneOf: ["free", "pro"] },
  age: { type: "number", required: false, min: 13, max: 120 },
};

function validate(schema, body) {
  const errors = [];
  const clean = {};
  for (const [field, rule] of Object.entries(schema)) {
    const value = body[field];
    if (value === undefined || value === null) {
      if (rule.required) errors.push(field + " is required");
      continue;
    }
    if (typeof value !== rule.type) { errors.push(field + " must be a " + rule.type); continue; }
    const size = rule.type === "string" ? value.trim().length : value;
    if (rule.min !== undefined && size < rule.min) errors.push(field + " is too small");
    if (rule.max !== undefined && size > rule.max) errors.push(field + " is too large");
    if (rule.oneOf && !rule.oneOf.includes(value)) errors.push(field + " must be one of " + rule.oneOf.join("/"));
    if (rule.email && !isEmail(value)) errors.push(field + " is invalid");
    clean[field] = rule.type === "string" ? value.trim() : value;
  }
  return { ok: errors.length === 0, errors, clean };
}

const bodies = [
  { name: "Asha", email: "asha@example.com", plan: "pro" },
  { name: "A", email: "asha@com", age: "twenty" },
  { name: "Ravi", email: "ravi@example.in", role: "admin" },
];
for (const body of bodies) console.log(JSON.stringify(validate(schema, body)));
`,
        codePython: `import json


def is_email(s):
    if " " in s:
        return False
    parts = s.split("@")
    if len(parts) != 2 or not parts[0]:
        return False
    domain = parts[1].split(".")
    return len(domain) >= 2 and all(len(d) > 0 for d in domain)


TYPE_NAMES = {str: "string", int: "number"}

schema = {
    "name": {"type": str, "required": True, "min": 2, "max": 50},
    "email": {"type": str, "required": True, "email": True},
    "plan": {"type": str, "required": False, "oneOf": ["free", "pro"]},
    "age": {"type": int, "required": False, "min": 13, "max": 120},
}


def validate(schema, body):
    errors, clean = [], {}
    for field, rule in schema.items():
        value = body.get(field)
        if value is None:
            if rule["required"]:
                errors.append(f"{field} is required")
            continue
        if not isinstance(value, rule["type"]):
            errors.append(f"{field} must be a {TYPE_NAMES[rule['type']]}")
            continue
        size = len(value.strip()) if rule["type"] is str else value
        if "min" in rule and size < rule["min"]:
            errors.append(f"{field} is too small")
        if "max" in rule and size > rule["max"]:
            errors.append(f"{field} is too large")
        if "oneOf" in rule and value not in rule["oneOf"]:
            errors.append(f"{field} must be one of {'/'.join(rule['oneOf'])}")
        if rule.get("email") and not is_email(value):
            errors.append(f"{field} is invalid")
        clean[field] = value.strip() if rule["type"] is str else value
    return {"ok": not errors, "errors": errors, "clean": clean}


bodies = [
    {"name": "Asha", "email": "asha@example.com", "plan": "pro"},
    {"name": "A", "email": "asha@com", "age": "twenty"},
    {"name": "Ravi", "email": "ravi@example.in", "role": "admin"},
]
for body in bodies:
    print(json.dumps(validate(schema, body)))
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Validation mein common galtiyan:

- **Sirf frontend pe validation**: HTML \`required\` attribute laga diya aur server pe kuch nahi. Postman se koi bhi bypass kar dega.
- **\`req.body\` seedha DB mein**: \`User.create(req.body)\` — mass assignment ka classic darwaaza. Hamesha allowed fields chuno.
- **Denylist approach**: "agar \`<script>\` hai to reject" — attacker \`<ScRiPt>\` ya koi aur trick laga dega. **Allowlist** karo: sirf jo sahi hai wo allow.
- **Pehli error pe ruk jaana**: user ek fix karta hai, phir doosri error, phir teesri... saari errors ek saath bhejo.
- **Validation ko injection ka ilaaj samajhna**: valid naam \`O'Brien\` mein bhi apostrophe hai! SQL ke liye **parameterised queries** hi asli fix hain.
- **Query params bhoolna**: \`?limit=999999\` ya \`?page=-1\` bhi input hai.
- **Number "string" mein aana**: query params hamesha string hote hain — convert karke range check karo.`,
          en: `Common validation mistakes:

- **Validating only in the frontend**; anyone can bypass it with Postman.
- **Saving \`req.body\` directly**, the classic mass-assignment hole.
- **Denylists** like "reject \`<script>\`", which attackers bypass; use **allowlists**.
- **Stopping at the first error** instead of returning all.
- **Treating validation as the injection fix**: valid names like \`O'Brien\` contain quotes; use **parameterised queries**.
- **Forgetting query params** like \`?limit=999999\`, which always arrive as strings.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Validation se related bugs kaise dhundhein:

1. **Valid request bhi 400 de rahi hai**: response ki \`errors\` list padho — kaunsa field fail hua? Aksar type mismatch hota hai: query param \`"5"\` string hai, schema number maang raha hai. Coercion (\`z.coerce.number()\`) use karo.
2. **Galat data DB mein pahunch gaya**: dekho kahin koi route schema skip to nahi kar raha — \`grep\` karo \`req.body\` ke direct uses.
3. **500 errors user input se**: logs mein stack trace dekho; agar crash \`undefined\` property pe hai to wo field validate nahi hua tha.
4. **Edge cases test karo**: empty string \`""\`, sirf spaces \`"   "\`, \`null\`, bahut lamba string, negative number, emoji, extra fields.

\`\`\`bash
curl -i -X POST localhost:3000/signup -H "Content-Type: application/json" \\
  -d '{"name":"   ","email":"x@y","age":-3,"role":"admin"}'
\`\`\`

Ek achhi API iska jawab **400** aur teen clear field errors se degi, aur \`role\` ko ignore karegi.`,
          en: `Debugging validation:

1. **Valid requests get 400**: read the \`errors\` list. Often a query param arrives as the string "5" while the schema expects a number; use coercion.
2. **Bad data reached the DB**: find routes that use \`req.body\` directly.
3. **500s from user input**: a crash on an undefined property means that field was never validated.
4. **Test edge cases**: empty string, only spaces, null, very long strings, negative numbers, emoji and extra fields. A good API answers such a request with 400, clear field errors, and ignores \`role\`.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Kitna validate karein, kahan karein — balance chahiye:

- **Bahut strict format** (jaise naam mein sirf A–Z) → asli users reject: "Ananya D'Souza", "Zoë", Tamil/Hindi naam. Naam jaise free-text pe sirf length aur control characters check karo.
- **Email regex ka obsession**: perfect email regex banana practically impossible hai. Simple check + **verification email** best hai.
- **Duplicate validation**: frontend aur backend dono pe same rules — maintenance double. Shared schema (jaise zod ko client-server dono pe use karna, ya OpenAPI se generate karna) se solve hota hai.
- **Validation vs business rules**: "email format sahi hai" validation hai (fast, bina DB). "Email pehle se registered hai" business rule hai (DB check, \`409\`). Dono alag layers mein rakho.
- **Performance**: schema validation bahut sasta hai; isse skip karne ka koi achha reason nahi hota.`,
          en: `Balance is needed:

- **Over-strict formats** reject real users like "Ananya D'Souza" or "Zoë"; for names check length and control characters only.
- **Perfect email regexes** are impractical; use a simple check plus a **verification email**.
- **Duplicated rules** on client and server are harder to maintain; share a schema (zod on both sides, or generate from OpenAPI).
- **Validation vs business rules**: format checks are fast and need no DB; "email already registered" is a business rule returning \`409\`.
- Schema validation is cheap, so there is rarely a reason to skip it.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek real Express project mein validation ka pattern:

\`\`\`js
const CreateOrder = z.object({
  restaurantId: z.string().uuid(),
  items: z.array(z.object({
    dishId: z.string().uuid(),
    qty: z.number().int().min(1).max(20),
  })).min(1).max(50),
  note: z.string().max(200).optional(),
}).strict(); // unknown fields → error

const validate = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.body);
  if (!r.success) return res.status(400).json({ errors: r.error.issues });
  req.data = r.data;
  next();
};

app.post("/orders", requireAuth, validate(CreateOrder), createOrder);
\`\`\`

Dhyaan do: \`userId\` body se **nahi** liya — wo \`req.user\` (token) se aata hai. Price bhi client se nahi, DB se. Client sirf wahi bhejta hai jo uska haq hai.`,
          en: `In a real Express project, a zod schema defines \`CreateOrder\` (uuid restaurant id, 1–50 items, integer qty 1–20, optional note up to 200 chars) with \`.strict()\` to reject unknown fields. A reusable \`validate(schema)\` middleware returns 400 with issues or sets \`req.data\` and calls \`next()\`. The route is \`app.post("/orders", requireAuth, validate(CreateOrder), createOrder)\`.

Note that \`userId\` is **not** taken from the body; it comes from the token. Prices come from the database, not the client.`,
        },
      },
    ],
    visualization: {
      kind: "FLOW",
      title: "Validation at the API boundary",
      steps: [
        { title: "Untrusted body arrives", description: "{ name: '  ', email: 'x@y', age: -3, role: 'admin' } reaches POST /signup.", highlight: "untrusted" },
        { title: "Parse with size limit", description: "express.json({ limit: '1mb' }) parses JSON and rejects huge payloads.", highlight: "limit" },
        { title: "Check each field", description: "name too short, email invalid, age out of range — all errors are collected.", highlight: "collect errors" },
        { title: "Strip unknown fields", description: "role is not in the allowlist schema, so it is dropped (or rejected).", highlight: "allowlist" },
        { title: "Respond or continue", description: "Errors → 400 with per-field messages. Clean data → handler receives a typed object.", highlight: "400 / next()" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "The signup form already validates email in the browser. Why validate again on the server?",
        options: [
          "Browsers are slow at validation",
          "Anyone can call the API directly (curl, Postman, scripts) and skip the frontend",
          "Servers cannot read JavaScript",
          "It is only needed for GET requests",
        ],
        correct: [1],
        explanation: "Frontend validation sirf user ki suvidha hai. Attacker seedha API call karke usse **bypass** kar sakta hai, isliye server pe validation zaroori hai.",
        tags: ["server-side"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "A user sends { \"name\": \"Ravi\", \"role\": \"admin\" } to POST /signup and becomes an admin. What is this vulnerability called?",
        options: ["Cross-site scripting", "Mass assignment", "Rate limiting", "Cache poisoning"],
        correct: [1],
        explanation: "Poora \`req.body\` DB mein save kar diya → user ne extra field \`role\` bhej ke khud ko admin bana liya. Ye **mass assignment** hai. Fix: allowlist — sirf allowed fields copy karo.",
        tags: ["mass-assignment", "security"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What status code should an API return when the request body fails validation?",
        options: ["200", "400 (or 422)", "500", "301"],
        correct: [1],
        explanation: "Galti client ke data mein hai → **4xx**. 400 Bad Request ya 422 Unprocessable Entity, saath mein field-wise errors. 500 ka matlab server ki galti hota hai.",
        tags: ["status-codes"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these are good validation practices? (Select all that apply)",
        options: [
          "Use an allowlist schema and drop unknown fields",
          "Return all field errors in one response",
          "Trust hidden form fields because users cannot see them",
          "Validate query params like limit and page too",
        ],
        correct: [0, 1, 3],
        explanation: "Allowlist, saari errors ek saath, aur query params bhi check — sab sahi. **Hidden fields** browser DevTools se badle ja sakte hain, unpe trust karna galat hai.",
        tags: ["best-practices"],
      },
      {
        type: "SPOT_BUG",
        difficulty: 2,
        prompt: "What is the most serious problem in this search route?",
        code: `app.get("/products", async (req, res) => {
  const q = req.query.search;
  const rows = await db.query(
    "SELECT id, name, price FROM products WHERE name LIKE '%" + q + "%'"
  );
  res.json(rows);
});`,
        codeLanguage: "javascript",
        options: [
          "It should use POST instead of GET",
          "User input is concatenated into SQL, allowing SQL injection; use a parameterised query",
          "LIKE queries are not allowed in SQL",
          "res.json cannot send arrays",
        ],
        correct: [1],
        explanation: "\`search\` mein \`' OR '1'='1\` jaisa input pura query badal dega. **String concat se SQL mat banao** — \`db.query(\"... WHERE name LIKE $1\", [\"%\" + q + \"%\"])\` jaisa parameterised query use karo. Saath mein length validate bhi karo.",
        tags: ["sql-injection", "security"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "Your signup endpoint returns 500 Internal Server Error whenever someone sends age as \"twenty\". Logs show a database type error. What should you change?",
        options: [
          "Catch the DB error and return 200",
          "Validate the body at the API boundary and return 400 with a clear field error before touching the database",
          "Remove the age column from the database",
          "Ask users to read the docs",
        ],
        correct: [1],
        explanation: "Galat input ko DB tak pahunchne hi mat do. Boundary pe validate karo → **400** + \`age must be a number\`. Isse 500 band, logs saaf, aur user ko pata chalta hai kya theek karna hai.",
        tags: ["error-handling"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps a POST /signup request should go through.",
        options: [
          "Parse the JSON body with a size limit",
          "Validate fields against the schema and collect errors",
          "Drop unknown fields like role",
          "Check business rules such as 'email already registered'",
          "Hash the password and save the user",
        ],
        explanation: "Pehle parse, phir format/type validation (sasta, bina DB), phir unknown fields hatao, phir DB wale business rules (409), aur last mein save.",
        tags: ["flow"],
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Why is an allowlist approach safer than a denylist for validating input?",
        keywords: ["allowlist", "known good", "denylist", "bypass", "unknown"],
        explanation: "Denylist bolta hai 'ye bure patterns block karo' — attacker naya pattern dhundh lega. Allowlist bolta hai 'sirf ye sahi format allowed' — jo bhi unknown hai wo apne aap reject. Isliye allowlist zyada safe hai.",
        tags: ["security"],
      },
    ],
    buildTask: {
      title: "validateSignup(body)",
      description: `Signup API ke liye validator likho. \`validateSignup(body)\` errors ki **list** return kare, **isi fixed order** mein (koi error nahi to \`[]\`):

1. \`name\` string ho aur trim karke length **2–50** ho, warna \`"name must be 2-50 characters"\`
2. \`email\` valid ho, warna \`"email is invalid"\`. Valid matlab: string, koi space nahi, exactly ek \`@\`, \`@\` se pehle kuch ho, aur \`@\` ke baad wala domain \`.\` se split karne pe **kam se kam 2 parts** de aur koi part khaali na ho.
3. \`password\` string ho aur length **≥ 8**, warna \`"password must be at least 8 characters"\`
4. \`password\` mein kam se kam ek digit (0–9) ho, warna \`"password must contain a number"\` (missing password pe 3 aur 4 dono errors)
5. \`age\` **optional** hai. Agar present hai (null/undefined nahi) to integer 13–120 ho, warna \`"age must be an integer between 13 and 120"\``,
      functionName: "validateSignup",
      starterJs: `function validateSignup(body) {
  const errors = [];
  // check name, email, password (length), password (digit), age — in this order
  return errors;
}
`,
      starterPython: `def validateSignup(body):
    errors = []
    # check name, email, password (length), password (digit), age — in this order
    return errors
`,
      tests: [
        { name: "valid body", args: [{ name: "Asha", email: "asha@example.com", password: "chai1234" }], expected: [] },
        { name: "empty body", args: [{}], expected: ["name must be 2-50 characters", "email is invalid", "password must be at least 8 characters", "password must contain a number"] },
        { name: "bad email domain", args: [{ name: "Ravi", email: "ravi@com", password: "vadapav99" }], expected: ["email is invalid"] },
        { name: "underage", args: [{ name: "Kiran", email: "kiran@mail.in", password: "cricket2024", age: 10 }], expected: ["age must be an integer between 13 and 120"] },
        { name: "name only spaces around one letter", args: [{ name: "  A  ", email: "a@b.co", password: "12345678", age: 30 }], expected: ["name must be 2-50 characters"] },
        { name: "password without digit and two @", args: [{ name: "Meera", email: "a@b@c.com", password: "abcdefgh" }], expected: ["email is invalid", "password must contain a number"], hidden: true },
        { name: "decimal age", args: [{ name: "Dev", email: "dev@x.org", password: "pass12345", age: 25.5 }], expected: ["age must be an integer between 13 and 120"], hidden: true },
      ],
      hints: [
        "Validation = har rule ek if-check. Error mile to list mein push karo, return mat karo — saari errors chahiye, fixed order mein.",
        "Order: name → email → password length → password digit → age. Missing values ko pehle safe default (\"\") maan lo taaki string methods crash na hon. Age sirf tab check karo jab wo present ho.",
        "JS: const name = typeof body.name === \"string\" ? body.name.trim() : \"\"; if (name.length < 2 || name.length > 50) errors.push(\"name must be 2-50 characters\"); ... if (body.age !== undefined && body.age !== null && !(Number.isInteger(body.age) && body.age >= 13 && body.age <= 120)) errors.push(...)",
      ],
      explainQuestions: [
        { question: "Why do you collect all errors instead of returning on the first one?", keywords: ["all errors", "user", "one request", "fix"] },
        { question: "How did you treat a missing or non-string field so your code does not crash?", keywords: ["typeof", "default", "empty string", "crash"] },
        { question: "If a client also sends role: 'admin', what should the signup handler do with it and why? (security)", keywords: ["ignore", "allowlist", "mass assignment", "privilege"] },
      ],
      estMinutes: 25,
    },
    interview: [
      {
        question: "Where and how should input validation happen in a backend?",
        short: "Validate on the server at every trust boundary, as early as possible — usually in middleware or the framework layer right after parsing — using an allowlist schema for body, query, params and headers. Return 400 or 422 with field-level errors, and pass only the validated object to business logic.",
        deep: `- **Client-side** validation is UX only; **server-side** is mandatory.
- Use schemas (zod, joi, Pydantic) so rules are declarative and reusable; generate docs and types from them.
- Validate **type, presence, length, format, range, enums**, and reject or strip unknown fields.
- Separate **syntactic validation** (shape) from **business rules** (uniqueness, stock) that need the DB.
- Also validate data from other services, queues and webhooks — internal does not mean trusted.
- Validation complements, but does not replace, parameterised queries and output encoding.`,
        followUps: ["How do you validate file uploads?", "What is the difference between 400 and 422?", "Should you validate data coming from your own microservices?"],
        commonMistake: "Relying on frontend validation or believing validation alone prevents SQL injection.",
        keywords: ["server-side", "allowlist schema", "trust boundary", "field errors"],
        difficulty: 1,
        roles: ["BACKEND", "FULLSTACK"],
      },
      {
        question: "What is mass assignment and how do you prevent it?",
        short: "Mass assignment happens when an API binds the whole request body to a model, so attackers can set fields they should not control, like role, isVerified or balance. Prevent it by explicitly picking allowed fields with a strict schema or DTO and setting sensitive fields only on the server.",
        deep: `- Vulnerable: \`await User.create(req.body)\` or \`user.update(req.body)\`.
- Safe: \`const { name, email } = SignupSchema.parse(req.body); await User.create({ name, email, role: "user" });\`
- Use \`.strict()\` (zod) or \`extra = "forbid"\` (Pydantic) to reject unknown fields, or strip them.
- Ownership fields (\`userId\`, \`tenantId\`) must come from the authenticated session, never the body.
- It is listed under OWASP API Security as broken object property level authorization.`,
        followUps: ["How would you allow admins to change role but not normal users?", "Is stripping or rejecting unknown fields better?"],
        commonMistake: "Filtering only the 'role' field (denylist) and forgetting new sensitive fields added later.",
        keywords: ["request body", "allowlist", "role", "dto", "server sets"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK"],
      },
    ],
    promptCard: {
      title: "Write validation rules and edge-case tests for my endpoint",
      category: "TESTING",
      task: "Turn an endpoint description into a strict validation schema plus a table of edge-case tests (valid and invalid inputs) with expected responses.",
      whenToUse: "When adding a new POST/PATCH endpoint, or when bad data keeps reaching your database.",
      template: `You are a backend engineer who writes strict input validation and thorough tests.

Framework and validation library: [FRAMEWORK_AND_LIBRARY]
Endpoint: [METHOD_AND_PATH]
Fields the client is allowed to send (name, type, rules if known): [FIELDS]
Fields that the server must set itself (never from the client): [SERVER_FIELDS]

1. Write the validation schema. Use an allowlist: reject or strip unknown fields. Give exact rules for type, required, length, format, range and allowed values.
2. List business rules that need the database (e.g. uniqueness) separately, with their status codes.
3. Write a test table with at least 12 cases: input JSON, expected status, expected error message. Include empty strings, whitespace-only strings, null, wrong types, boundary values, very long strings, unicode names, and an attempt to send a server-only field.
4. Write the tests in [TEST_FRAMEWORK].
Do not invent fields I did not list; ask if a rule is unclear.`,
      variables: [
        { key: "FRAMEWORK_AND_LIBRARY", label: "e.g. Express + zod, FastAPI + Pydantic" },
        { key: "METHOD_AND_PATH", label: "e.g. POST /v1/orders" },
        { key: "FIELDS", label: "Client fields with types and any known rules" },
        { key: "SERVER_FIELDS", label: "Fields only the server sets (userId, role, price...)" },
        { key: "TEST_FRAMEWORK", label: "e.g. Jest + supertest, pytest + httpx" },
      ],
      whyItWorks: [
        { part: "Allowlist instruction", why: "Prevents mass assignment by design instead of hoping you remember to filter fields." },
        { part: "Server-only fields", why: "Makes it explicit that ownership and pricing must never come from the request body." },
        { part: "Named edge cases", why: "Models tend to test only happy paths unless you list boundary and abuse cases." },
        { part: "Separate DB rules", why: "Keeps fast schema validation apart from uniqueness checks with different status codes." },
      ],
      verifyChecklist: [
        "Schema rejects or strips unknown fields",
        "Boundary values (min, max, min-1, max+1) are tested",
        "A test sends a server-only field and expects it to be ignored or rejected",
        "Error responses use your API's standard error format",
        "Run the generated tests and confirm they fail if you remove a rule",
      ],
      sampleOutput: `const CreateOrder = z.object({
  restaurantId: z.string().uuid(),
  items: z.array(z.object({ dishId: z.string().uuid(), qty: z.number().int().min(1).max(20) })).min(1),
}).strict();

| # | input | status | error |
| 1 | valid order | 201 | - |
| 2 | qty: 0 | 400 | items[0].qty must be >= 1 |
| 3 | extra field price: 1 | 400 | Unrecognized key: price |
...`,
    },
  },
  // ───────────────────────────── 5. SQL basics ─────────────────────────────
  {
    slug: "sql-basics",
    estMinutes: 45,
    difficulty: 1,
    prerequisites: ["what-is-an-api", "json-basics"],
    objectives: [
      "Create tables with primary keys and suitable column types",
      "Write SELECT queries with WHERE, ORDER BY, LIMIT, GROUP BY and aggregates",
      "Safely INSERT, UPDATE and DELETE rows using parameterised queries",
      "Explain the logical order in which a SELECT query is evaluated",
    ],
    technicalDefinition:
      "SQL (Structured Query Language) is a declarative language for relational databases in which data is stored in tables of rows and typed columns; it provides DDL statements (CREATE, ALTER, DROP) to define schema and DML statements (SELECT, INSERT, UPDATE, DELETE) to query and modify data, with the database engine choosing how to execute each query.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**SQL** wo language hai jisse hum **relational database** (PostgreSQL, MySQL, SQLite) se baat karte hain. Data **tables** mein rehta hai — bilkul Excel sheet jaisa: har **row** ek record (ek user, ek order), har **column** ek property (\`name\`, \`email\`, \`amount\`).

Chaar main kaam (CRUD):
- \`INSERT\` — nayi row daalo
- \`SELECT\` — data padho
- \`UPDATE\` — row badlo
- \`DELETE\` — row hatao

SQL **declarative** hai: tum batate ho **kya** chahiye ("Pune ke saare orders, amount ke hisaab se"), **kaise** dhundhna hai wo database khud decide karta hai. Har table ka ek **primary key** hota hai (jaise \`id\`) jo har row ko uniquely pehchanta hai.`,
          en: `**SQL** is the language for talking to **relational databases** such as PostgreSQL, MySQL and SQLite. Data lives in **tables**, like a spreadsheet: each **row** is a record (a user, an order) and each **column** is a property (\`name\`, \`email\`, \`amount\`).

The four main operations (CRUD) are \`INSERT\`, \`SELECT\`, \`UPDATE\` and \`DELETE\`.

SQL is **declarative**: you say **what** you want ("all Pune orders sorted by amount") and the database decides **how** to find it. Each table has a **primary key** (like \`id\`) that uniquely identifies every row.`,
          hi: `**SQL** वह भाषा है जिससे हम **relational database** (PostgreSQL, MySQL, SQLite) से बात करते हैं। डेटा **tables** में रहता है — बिल्कुल Excel शीट की तरह: हर **row** एक रिकॉर्ड (एक user, एक order), हर **column** एक गुण (\`name\`, \`email\`, \`amount\`)।

चार मुख्य काम (CRUD):
- \`INSERT\` — नई row डालो
- \`SELECT\` — डेटा पढ़ो
- \`UPDATE\` — row बदलो
- \`DELETE\` — row हटाओ

SQL **declarative** है: आप बताते हैं **क्या** चाहिए, **कैसे** ढूँढना है यह database खुद तय करता है। हर table की एक **primary key** होती है जो हर row को अलग पहचानती है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Kirana store ka register** socho. Sharma ji ke paas ek bada register hai jisme har line ek udhaar entry hai: \`id\`, \`customer\`, \`item\`, \`amount\`, \`date\`.

- Nayi entry likhna → \`INSERT\`
- "Gupta ji ka kitna udhaar hai?" → \`SELECT SUM(amount) FROM udhaar WHERE customer = 'Gupta'\`
- Galat amount theek karna → \`UPDATE\`
- Payment mil gaya, entry kaatna → \`DELETE\`

Sharma ji ko tum ye nahi batate ki "page 1 se shuru karo, ungli neeche le jao..." — tum bas bolte ho **kya chahiye**. Wo apne tareeke se dhundh lete hain. Yahi SQL ka declarative nature hai.

Aur har entry ka ek unique serial number hai taaki "entry number 42 kaato" bolne pe confusion na ho — wahi **primary key** hai.`,
          en: `Think of a **kirana store's credit register**. Each line is an entry: \`id\`, \`customer\`, \`item\`, \`amount\`, \`date\`.

- Writing a new entry is \`INSERT\`.
- "How much does Gupta ji owe?" is \`SELECT SUM(amount) FROM udhaar WHERE customer = 'Gupta'\`.
- Fixing a wrong amount is \`UPDATE\`.
- Striking off a paid entry is \`DELETE\`.

You never tell the shopkeeper how to scan the pages; you say **what** you want. That is SQL being declarative. Each entry's unique serial number, so "strike entry 42" is unambiguous, is the **primary key**.`,
          hi: `**किराना दुकान का उधार रजिस्टर** सोचिए। हर पंक्ति एक एंट्री है: \`id\`, \`customer\`, \`item\`, \`amount\`, \`date\`।

- नई एंट्री लिखना → \`INSERT\`
- "गुप्ता जी का कितना उधार है?" → \`SELECT SUM(amount) ... WHERE customer = 'Gupta'\`
- गलत राशि ठीक करना → \`UPDATE\`
- भुगतान मिल गया, एंट्री काटना → \`DELETE\`

आप दुकानदार को यह नहीं बताते कि पन्ने कैसे पलटें — बस बताते हैं **क्या चाहिए**। यही SQL का declarative स्वभाव है। हर एंट्री का अलग क्रमांक, ताकि "एंट्री 42 काटो" में कोई भ्रम न हो — वही **primary key** है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Data ko JSON files ya JS arrays mein kyun nahi rakhte? Chhote project mein chal jaata hai, par jaise hi app badhti hai:

- **Do users ek saath likhein** to file corrupt ho sakti hai. Database **transactions** aur locking sambhalta hai.
- **10 lakh orders mein se Pune ke** dhundhne hon to poori file load karni padegi. DB **indexes** se milliseconds mein deta hai.
- **Rules enforce karna**: email unique ho, amount negative na ho, order ka user exist kare — DB constraints (\`UNIQUE\`, \`CHECK\`, \`FOREIGN KEY\`) ye guarantee karte hain.
- **Server crash** ho jaaye to bhi committed data safe rehta hai (durability).
- **Reports**: "har city ka total revenue" ek line ka \`GROUP BY\` hai.

SQL 50 saal purana hai aur aaj bhi har badi company (banks, IRCTC jaise booking systems, e-commerce) ka core data relational DB mein hai. Backend developer ke liye ye non-negotiable skill hai.`,
          en: `Why not keep data in JSON files or arrays? It works for tiny projects, but as the app grows:

- **Concurrent writes** can corrupt files; databases handle transactions and locking.
- **Finding Pune orders among a million** would mean loading everything; indexes answer in milliseconds.
- **Rules** like unique email or non-negative amounts are enforced by constraints (\`UNIQUE\`, \`CHECK\`, \`FOREIGN KEY\`).
- **Crashes** do not lose committed data.
- **Reports** like revenue per city are one \`GROUP BY\`.

That is why SQL is a must-have backend skill.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `SQL databases kahan-kahan:

- **Instagram** ne publicly bataya hai ki unka core data (users, photos metadata) **PostgreSQL** pe shuru hua aur bahut bade scale tak gaya, sharding ke saath.
- **Banking aur UPI apps**: account balance aur transactions relational DB mein hote hain kyunki unhe strong consistency chahiye — paisa na gayab ho, na double ho.
- **E-commerce (Flipkart/Amazon type)**: orders, payments, inventory jaise core tables relational hote hain; reporting ke liye SQL queries chalti hain (\`GROUP BY\` city, category).
- **Mobile apps**: Android aur iOS dono mein **SQLite** built-in hai — WhatsApp jaisi apps phone pe local data SQLite mein rakhti hain.

Matlab chahe server ho ya phone, SQL har jagah hai.`,
          en: `Where SQL databases show up:

- **Instagram** has publicly described starting its core data on **PostgreSQL** and scaling it with sharding.
- **Banking and UPI apps** keep balances and transactions in relational databases because they need strong consistency.
- **E-commerce** systems store orders, payments and inventory in relational tables and run SQL reports.
- **Mobile apps**: Android and iOS ship **SQLite**, and apps like WhatsApp keep local data in it.

From servers to phones, SQL is everywhere.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Jab tum query bhejte ho, DB andar ye karta hai:

1. **Parse**: SQL text ko check karta hai — syntax sahi hai?
2. **Plan**: query planner decide karta hai kaise chalana hai — poori table scan karein ya index use karein? (\`EXPLAIN\` se ye plan dekh sakte ho.)
3. **Execute**: plan ke hisaab se rows padhta hai.

\`SELECT\` ka **logical order** likhne ke order se alag hai:

1. \`FROM\` — kaunsi table
2. \`WHERE\` — rows filter
3. \`GROUP BY\` — groups banao
4. \`HAVING\` — groups filter
5. \`SELECT\` — columns chuno / calculate
6. \`ORDER BY\` — sort
7. \`LIMIT\` — kitni rows

Isliye \`WHERE\` mein \`SUM()\` use nahi kar sakte (groups abhi bane hi nahi) — uske liye \`HAVING\` hai. Aur \`UPDATE\`/\`DELETE\` ke saath \`WHERE\` nahi lagaya to **saari rows** pe lag jaata hai.`,
          en: `When you send a query, the database **parses** it, the **planner** chooses how to run it (full scan or index; see it with \`EXPLAIN\`), then it **executes** the plan.

The **logical order** of a \`SELECT\` differs from the written order:

1. \`FROM\`
2. \`WHERE\` filters rows
3. \`GROUP BY\` makes groups
4. \`HAVING\` filters groups
5. \`SELECT\` picks columns
6. \`ORDER BY\` sorts
7. \`LIMIT\` cuts

So aggregates like \`SUM()\` cannot go in \`WHERE\`; use \`HAVING\`. And \`UPDATE\`/\`DELETE\` without \`WHERE\` affect **every row**.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `**Python** version asli SQL chalata hai — \`sqlite3\` stdlib mein hai, \`:memory:\` database RAM mein banta hai:

- \`CREATE TABLE\` se \`orders\` table, \`id INTEGER PRIMARY KEY\` apne aap badhta hai.
- \`executemany(... VALUES (?, ?, ?))\` — \`?\` **placeholders** hain. Values alag bhejte hain, string jodke nahi. Yahi SQL injection se bachata hai.
- \`WHERE\` + \`ORDER BY\` + \`LIMIT\`, phir \`GROUP BY city\` ke saath \`SUM\` aur \`COUNT\`.
- \`UPDATE ... WHERE id = ?\` aur \`DELETE ... WHERE\` — \`rowcount\` batata hai kitni rows badli.

**JavaScript** version same queries ko arrays pe simulate karta hai (\`filter\` = WHERE, \`sort\` = ORDER BY, \`slice\` = LIMIT, \`reduce\` = GROUP BY) taaki tum dekh sako ki DB andar logically kya karta hai. Real Node app mein tum \`pg\` library se \`await pool.query("SELECT ... WHERE city = $1", [city])\` likhte.`,
          en: `The **Python** version runs real SQL with the built-in \`sqlite3\` module and an in-memory database:

- \`CREATE TABLE\` makes \`orders\` with an auto-incrementing primary key.
- \`?\` **placeholders** pass values separately from the SQL text, which prevents injection.
- It runs \`WHERE\` + \`ORDER BY\` + \`LIMIT\`, then \`GROUP BY\` with \`SUM\` and \`COUNT\`.
- \`UPDATE\` and \`DELETE\` use \`WHERE\`, and \`rowcount\` shows affected rows.

The **JavaScript** version simulates the same queries with \`filter\`, \`sort\`, \`slice\` and \`reduce\`. In real Node you would use \`pg\` with \`$1\` placeholders.`,
        },
        codeJs: `// In-memory simulation of the same SQL queries (no database needed)
let nextId = 1;
const orders = [];
function insert(customer, city, amount) { orders.push({ id: nextId++, customer, city, amount }); }

insert("Asha", "Pune", 250);
insert("Ravi", "Delhi", 120);
insert("Meera", "Pune", 400);
insert("Kabir", "Mumbai", 90);
insert("Asha", "Pune", 60);

// SELECT customer, amount FROM orders WHERE city = 'Pune' ORDER BY amount DESC LIMIT 2
const top = orders
  .filter((o) => o.city === "Pune")
  .sort((a, b) => b.amount - a.amount)
  .slice(0, 2)
  .map((o) => [o.customer, o.amount]);
console.log("Top Pune orders:", JSON.stringify(top));

// SELECT city, SUM(amount), COUNT(*) FROM orders GROUP BY city ORDER BY city
const groups = {};
for (const o of orders) {
  groups[o.city] = groups[o.city] || { total: 0, count: 0 };
  groups[o.city].total += o.amount;
  groups[o.city].count += 1;
}
for (const city of Object.keys(groups).sort()) {
  console.log(city, groups[city].total, groups[city].count);
}

// UPDATE orders SET amount = 100 WHERE id = 4
let changed = 0;
for (const o of orders) if (o.id === 4) { o.amount = 100; changed++; }
console.log("rows updated:", changed);

// DELETE FROM orders WHERE amount < 100
const before = orders.length;
const kept = orders.filter((o) => !(o.amount < 100));
console.log("rows deleted:", before - kept.length, "remaining:", kept.length);
`,
        codePython: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute(
    "CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT NOT NULL, "
    "city TEXT NOT NULL, amount INTEGER NOT NULL CHECK (amount >= 0))"
)
db.executemany(
    "INSERT INTO orders (customer, city, amount) VALUES (?, ?, ?)",
    [("Asha", "Pune", 250), ("Ravi", "Delhi", 120), ("Meera", "Pune", 400),
     ("Kabir", "Mumbai", 90), ("Asha", "Pune", 60)],
)

top = db.execute(
    "SELECT customer, amount FROM orders WHERE city = ? ORDER BY amount DESC LIMIT 2",
    ("Pune",),
).fetchall()
print("Top Pune orders:", top)

for city, total, count in db.execute(
    "SELECT city, SUM(amount), COUNT(*) FROM orders GROUP BY city ORDER BY city"
):
    print(city, total, count)

cur = db.execute("UPDATE orders SET amount = ? WHERE id = ?", (100, 4))
print("rows updated:", cur.rowcount)

cur = db.execute("DELETE FROM orders WHERE amount < ?", (100,))
remaining = db.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
print("rows deleted:", cur.rowcount, "remaining:", remaining)
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `SQL mein beginners ki classic galtiyan:

- **\`UPDATE\`/\`DELETE\` bina \`WHERE\`**: \`DELETE FROM users;\` — poori table saaf! Hamesha pehle same \`WHERE\` ke saath \`SELECT\` chalake dekho kitni rows aayengi.
- **String jodke query banana**: \`"... WHERE email = '" + email + "'"\` → SQL injection. Hamesha placeholders (\`?\`, \`$1\`).
- **\`SELECT *\` har jagah**: bekaar columns (bade text, password hash) bhi aa jaate hain. Sirf zaroori columns maango.
- **\`= NULL\` likhna**: NULL compare karne ke liye \`IS NULL\` chahiye. \`WHERE phone = NULL\` kabhi kuch nahi lautata.
- **WHERE mein aggregate**: \`WHERE COUNT(*) > 5\` error deta hai — \`HAVING\` use karo.
- **Paise float mein**: \`FLOAT\` rounding errors deta hai. \`INTEGER\` paise mein ya \`NUMERIC\` use karo.
- **Primary key na banana** ya natural cheez (jaise phone number) ko primary key banana jo badal sakti hai.`,
          en: `Classic SQL mistakes:

- **\`UPDATE\`/\`DELETE\` without \`WHERE\`** wipes or changes every row; run a \`SELECT\` with the same \`WHERE\` first.
- **Building queries by string concatenation**, which enables SQL injection; use placeholders.
- **\`SELECT *\` everywhere**, fetching unneeded and sensitive columns.
- **\`= NULL\`** instead of \`IS NULL\`.
- **Aggregates in \`WHERE\`**; use \`HAVING\`.
- **Money as \`FLOAT\`**; use integer paise or \`NUMERIC\`.
- **Missing or changeable primary keys** like phone numbers.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Query galat result de rahi hai ya slow hai? Ye karo:

1. **Query ko chhote tukdon mein todo**: pehle sirf \`SELECT * FROM orders WHERE city = 'Pune'\` — sahi rows aa rahi hain? Phir \`GROUP BY\` jodo, phir \`ORDER BY\`.
2. **Zero rows aa rahi hain?** Case aur spaces check karo (\`'pune'\` vs \`'Pune'\`, \`'Pune '\`). NULL ke liye \`IS NULL\`.
3. **Count zyada aa raha hai?** Aksar JOIN ki wajah se rows duplicate ho jaati hain — har table ka count alag se check karo.
4. **Error "column must appear in GROUP BY"**: SELECT mein jo non-aggregate column hai wo GROUP BY mein bhi hona chahiye.
5. **Slow query**: \`EXPLAIN\` (Postgres mein \`EXPLAIN ANALYZE\`) chalao — "Seq Scan" dikhe badi table pe to index ki zaroorat hai.
6. **App se aayi query ka asli SQL** dekhna ho to ORM ka query logging on karo (Prisma: \`log: ["query"]\`).

Production DB pe pehle hamesha read-only \`SELECT\` se experiment karo.`,
          en: `When a query is wrong or slow:

1. **Build it up step by step**: run the bare \`WHERE\` first, then add \`GROUP BY\` and \`ORDER BY\`.
2. **Zero rows?** Check case, trailing spaces and use \`IS NULL\` for nulls.
3. **Counts too high?** Joins often duplicate rows; check each table's count.
4. **"Column must appear in GROUP BY"**: non-aggregated selected columns must be grouped.
5. **Slow?** Run \`EXPLAIN\` and look for sequential scans on big tables.
6. Turn on ORM query logging to see the real SQL. Experiment with read-only \`SELECT\` first.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `SQL database kab perfect nahi hai:

- **Bahut flexible / badalta schema** (jaise har product ke alag attributes): document DB jaise **MongoDB** easy lagta hai. Par Postgres ka \`JSONB\` column bhi ye kaafi had tak handle kar leta hai.
- **Bahut zyada writes, simple key lookups** (jaise session store, counters): **Redis** jaisa key-value store fast hai.
- **Full-text search** ("samsung phone 5g under 20000"): Elasticsearch/OpenSearch better hai.
- **Analytics on billions of rows**: columnar warehouses (BigQuery, ClickHouse) zyada fast.

SQL ki taakat: strong consistency, transactions, joins, constraints aur 50 saal ka tooling. Isliye default rule: **pehle relational DB se shuru karo**, specific problem aaye tab specialised DB jodo. Raw SQL vs ORM bhi tradeoff hai — ORM productivity deta hai, raw SQL control. Dono samajhna zaroori hai.`,
          en: `When SQL is not the perfect fit:

- **Very flexible schemas**: MongoDB can feel easier, though Postgres \`JSONB\` covers many cases.
- **Huge volumes of simple key lookups** like sessions or counters: **Redis** is faster.
- **Full-text search**: Elasticsearch or OpenSearch.
- **Analytics on billions of rows**: columnar warehouses like BigQuery or ClickHouse.

SQL's strengths are consistency, transactions, joins and constraints, so start with a relational database and add specialised stores for specific problems. ORMs add productivity; raw SQL gives control.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek real food-ordering backend ki SQL kuch aisi dikhti hai:

\`\`\`sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending','paid','delivered')),
  total_paise INTEGER NOT NULL CHECK (total_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
\`\`\`

API route "meri recent orders" ye chalata hai:

\`\`\`sql
SELECT id, status, total_paise, created_at
FROM orders WHERE user_id = $1
ORDER BY created_at DESC LIMIT 20;
\`\`\`

Dhyaan do: paise integer mein, status pe \`CHECK\`, \`user_id\` foreign key, aur \`$1\` placeholder. Schema changes **migrations** (Prisma Migrate, Alembic) se hote hain, haath se nahi.`,
          en: `A real food-ordering backend defines \`users\` (unique email) and \`orders\` (foreign key \`user_id\`, a \`CHECK\` on status values, \`total_paise\` as a non-negative integer, timestamps). The "my recent orders" route runs \`SELECT id, status, total_paise, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20\`.

Notice: money in integer paise, constraints in the database, a foreign key, a \`$1\` placeholder, and schema changes made through **migrations** (Prisma Migrate, Alembic), never by hand.`,
        },
      },
    ],
    visualization: {
      kind: "CUSTOM_STEPS",
      title: "How SELECT city, SUM(amount) ... is evaluated",
      steps: [
        { title: "FROM orders", description: "Start with all 5 rows of the orders table.", highlight: "FROM" },
        { title: "WHERE amount >= 100", description: "Rows with amount below 100 are removed; 3 rows remain.", highlight: "WHERE" },
        { title: "GROUP BY city", description: "Remaining rows are bucketed: Pune (2 rows), Delhi (1 row).", highlight: "GROUP BY" },
        { title: "HAVING SUM(amount) > 200", description: "Only groups whose total passes are kept: Pune (650).", highlight: "HAVING" },
        { title: "SELECT + ORDER BY + LIMIT", description: "Compute the output columns, sort them, and return at most N rows.", highlight: "SELECT" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which SQL clause filters individual rows before grouping?",
        options: ["ORDER BY", "WHERE", "HAVING", "LIMIT"],
        correct: [1],
        explanation: "**WHERE** rows ko filter karta hai, grouping se pehle. HAVING groups ko filter karta hai (GROUP BY ke baad).",
        tags: ["where"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What does `DELETE FROM users;` do?",
        options: ["Deletes the users table structure", "Deletes every row in users", "Deletes only the first row", "Fails because WHERE is required"],
        correct: [1],
        explanation: "Bina WHERE ke DELETE **saari rows** hata deta hai (table ka structure rehta hai, wo \`DROP TABLE\` se jaata). Isliye hamesha WHERE double-check karo.",
        tags: ["delete", "safety"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the main job of a primary key?",
        options: ["To sort the table alphabetically", "To uniquely identify each row", "To encrypt the row", "To store the password"],
        correct: [1],
        explanation: "Primary key har row ki **unique pehchaan** hai — do rows ka same id nahi ho sakta, aur NULL bhi nahi. Foreign keys isi ko refer karti hain.",
        tags: ["keys"],
      },
      {
        type: "MULTI",
        difficulty: 1,
        prompt: "Which statements change data in a table? (Select all that apply)",
        options: ["INSERT", "SELECT", "UPDATE", "DELETE"],
        correct: [0, 2, 3],
        explanation: "INSERT, UPDATE, DELETE data badalte hain. **SELECT** sirf padhta hai — isliye read-only access mein sirf SELECT allowed hota hai.",
        tags: ["crud"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "What does this Python + SQLite code print?",
        code: `import sqlite3
db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY, city TEXT, amount INTEGER)")
db.executemany("INSERT INTO orders (city, amount) VALUES (?, ?)",
               [("Pune", 200), ("Delhi", 150), ("Pune", 300), ("Mumbai", 100)])
rows = db.execute(
    "SELECT city, SUM(amount) FROM orders GROUP BY city ORDER BY SUM(amount) DESC"
).fetchall()
print(rows[0])`,
        codeLanguage: "python",
        options: ["('Pune', 500)", "('Pune', 300)", "('Delhi', 150)", "('Mumbai', 100)"],
        correct: [0],
        explanation: "GROUP BY city se Pune ke dono orders jud gaye: 200 + 300 = 500. Delhi 150, Mumbai 100. DESC sort mein sabse upar **('Pune', 500)**.",
        tags: ["group-by"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "An intern ran `UPDATE users SET plan = 'pro';` on production and every user became pro. How should the team prevent this in future?",
        options: [
          "Ban the UPDATE statement completely",
          "Run risky changes inside a transaction, check the affected row count before COMMIT, require reviewed migrations/scripts, and keep tested backups",
          "Only allow updates on weekends",
          "Switch to MongoDB",
        ],
        correct: [1],
        explanation: "\`BEGIN; UPDATE ... WHERE ...;\` → rowcount dekho → galat hai to \`ROLLBACK\`. Saath mein review aur backups. Process se galti pakdi jaati hai, database badalne se nahi.",
        tags: ["safety", "transactions"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 3,
        prompt: "Put the clauses of a SELECT query in the LOGICAL order the database evaluates them.",
        options: ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY", "LIMIT"],
        explanation: "Likhte hum SELECT se hain, par DB pehle FROM (table), phir WHERE (rows), GROUP BY, HAVING (groups), phir SELECT (columns), ORDER BY aur last mein LIMIT.",
        tags: ["query-order"],
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Why should you use parameterised queries (placeholders like ? or $1) instead of building SQL strings with user input?",
        keywords: ["sql injection", "placeholder", "data not code", "concatenation"],
        explanation: "String concat mein user ka input SQL **code** ban sakta hai (\`' OR 1=1 --\`). Placeholders mein value alag bhejte hain, DB usse hamesha **data** maanta hai — injection possible hi nahi.",
        tags: ["security"],
      },
    ],
    buildTask: {
      title: "Build a mini SELECT engine",
      description: `SQL andar kya karta hai, khud banao! Likho \`runSelect(rows, query)\`:

- \`rows\`: objects ki list (table).
- \`query.where\` (optional): object, jaise \`{ "city": "Pune" }\` — har key-value **equal** honi chahiye (AND).
- \`query.orderBy\` (optional): \`{ "column": "amount", "direction": "ASC" | "DESC" }\`.
- \`query.limit\` (optional): number.
- \`query.columns\`: column names ki list, ya \`["*"]\` matlab saare columns.

Order wahi jo DB follow karta hai: **WHERE → ORDER BY → LIMIT → SELECT columns**. Original \`rows\` ko modify mat karna. Tests mein sort column ke values unique hain.`,
      functionName: "runSelect",
      starterJs: `function runSelect(rows, query) {
  // WHERE -> ORDER BY -> LIMIT -> pick columns
  return [];
}
`,
      starterPython: `def runSelect(rows, query):
    # WHERE -> ORDER BY -> LIMIT -> pick columns
    return []
`,
      tests: [
        {
          name: "where + columns",
          args: [[{ id: 1, city: "Pune", amount: 250 }, { id: 2, city: "Delhi", amount: 120 }, { id: 3, city: "Pune", amount: 400 }], { columns: ["id"], where: { city: "Pune" } }],
          expected: [{ id: 1 }, { id: 3 }],
        },
        {
          name: "order desc + limit",
          args: [[{ id: 1, amount: 250 }, { id: 2, amount: 120 }, { id: 3, amount: 400 }], { columns: ["id", "amount"], orderBy: { column: "amount", direction: "DESC" }, limit: 2 }],
          expected: [{ id: 3, amount: 400 }, { id: 1, amount: 250 }],
        },
        {
          name: "star selects all columns",
          args: [[{ id: 1, name: "Chai" }, { id: 2, name: "Samosa" }], { columns: ["*"], where: { id: 2 } }],
          expected: [{ id: 2, name: "Samosa" }],
        },
        {
          name: "no match returns empty",
          args: [[{ id: 1, city: "Pune" }], { columns: ["id"], where: { city: "Goa" } }],
          expected: [],
        },
        {
          name: "order asc by text",
          args: [[{ name: "Vada Pav" }, { name: "Chai" }, { name: "Poha" }], { columns: ["name"], orderBy: { column: "name", direction: "ASC" } }],
          expected: [{ name: "Chai" }, { name: "Poha" }, { name: "Vada Pav" }],
        },
        {
          name: "multiple where conditions (AND)",
          args: [[{ id: 1, city: "Pune", status: "paid" }, { id: 2, city: "Pune", status: "pending" }, { id: 3, city: "Delhi", status: "paid" }], { columns: ["id"], where: { city: "Pune", status: "paid" } }],
          expected: [{ id: 1 }],
          hidden: true,
        },
        {
          name: "where, order and limit together",
          args: [[{ id: 1, city: "Pune", amount: 50 }, { id: 2, city: "Pune", amount: 90 }, { id: 3, city: "Delhi", amount: 500 }, { id: 4, city: "Pune", amount: 70 }], { columns: ["id"], where: { city: "Pune" }, orderBy: { column: "amount", direction: "ASC" }, limit: 2 }],
          expected: [{ id: 1 }, { id: 4 }],
          hidden: true,
        },
      ],
      hints: [
        "SQL ka logical order follow karo: pehle rows filter (WHERE), phir sort (ORDER BY), phir cut (LIMIT), aur aakhir mein columns chuno (SELECT).",
        "where ke har key ke liye row[key] === value check karo (sab true hone chahiye). Sort ke liye copy banao ([...rows] / sorted()). Limit undefined ho to sab rows rakho.",
        "JS: let out = rows.filter(r => Object.entries(query.where || {}).every(([k, v]) => r[k] === v)); if (query.orderBy) { const { column, direction } = query.orderBy; out = [...out].sort((a, b) => (a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0) * (direction === \"DESC\" ? -1 : 1)); }",
      ],
      explainQuestions: [
        { question: "Why must LIMIT be applied after ORDER BY and not before?", keywords: ["top", "sorted", "wrong rows", "order"] },
        { question: "How does your function avoid modifying the original rows array?", keywords: ["copy", "filter", "new array", "mutate"] },
        { question: "If the where values came from user input in a real database, how would you pass them safely? (security)", keywords: ["parameterised", "placeholder", "sql injection", "never concatenate"] },
      ],
      estMinutes: 25,
    },
    interview: [
      {
        question: "What is the difference between WHERE and HAVING?",
        short: "WHERE filters individual rows before grouping and cannot use aggregate functions. HAVING filters groups after GROUP BY and can use aggregates like SUM or COUNT. Use WHERE whenever possible because it reduces rows early.",
        deep: `- Logical order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.
- Example: cities with more than 100 paid orders:
  \`SELECT city, COUNT(*) FROM orders WHERE status = 'paid' GROUP BY city HAVING COUNT(*) > 100;\`
- Moving a non-aggregate condition from HAVING to WHERE lets the database filter early and use indexes.`,
        followUps: ["Can you use a column alias from SELECT in WHERE?", "What happens if you select a column that is not in GROUP BY?"],
        commonMistake: "Putting aggregate conditions in WHERE, or filtering plain columns in HAVING and wasting work.",
        keywords: ["before grouping", "after group by", "aggregate", "filter"],
        difficulty: 1,
        roles: ["BACKEND", "FULLSTACK", "SDE"],
      },
      {
        question: "What are primary keys and foreign keys, and why use constraints in the database?",
        short: "A primary key uniquely identifies each row and cannot be null. A foreign key in one table references a primary key in another, guaranteeing the referenced row exists. Constraints like NOT NULL, UNIQUE, CHECK and foreign keys enforce data integrity even if application code has bugs.",
        deep: `- PK: usually a surrogate key (\`BIGSERIAL\` or UUID); natural keys like phone numbers can change.
- FK: \`orders.user_id REFERENCES users(id)\`; choose \`ON DELETE\` behaviour (RESTRICT, CASCADE, SET NULL) deliberately.
- Constraints are the last line of defence: two concurrent requests can both pass an app-level "email exists?" check, but a \`UNIQUE\` index rejects the second insert.
- Index FK columns that you filter or join on.`,
        followUps: ["UUID vs auto-increment IDs — pros and cons?", "What does ON DELETE CASCADE do and when is it dangerous?"],
        commonMistake: "Enforcing uniqueness only in application code, which fails under concurrent requests.",
        keywords: ["unique identity", "references", "integrity", "unique constraint"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK"],
      },
      {
        question: "How do you prevent SQL injection?",
        short: "Never build SQL by concatenating user input. Use parameterised queries or prepared statements, which send values separately so the database treats them as data. ORMs do this by default. For identifiers like column names in sorting, map user input to an allowlist.",
        deep: `- Vulnerable: \`"SELECT * FROM users WHERE email = '" + email + "'"\`.
- Safe: \`pool.query("SELECT * FROM users WHERE email = $1", [email])\`.
- Placeholders cannot be used for table or column names, so for \`?sort=price\` map to an allowlist: \`{ price: "price", newest: "created_at" }\`.
- Be careful with ORM raw-query escape hatches (\`$queryRawUnsafe\`, \`text()\` with f-strings).
- Defence in depth: least-privilege DB users, input validation, and not exposing DB errors to clients.`,
        followUps: ["Can you parameterise an ORDER BY column?", "Is escaping quotes manually enough?", "How do ORMs still become vulnerable?"],
        commonMistake: "Thinking input validation or escaping quotes by hand is a complete fix.",
        keywords: ["parameterised queries", "prepared statements", "allowlist", "never concatenate"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK"],
      },
    ],
  },
  // ───────────────────────────── 6. Database indexes ─────────────────────────────
  {
    slug: "db-indexes",
    estMinutes: 45,
    difficulty: 2,
    prerequisites: ["sql-basics"],
    objectives: [
      "Explain how a B-tree index turns a full table scan into a fast lookup",
      "Choose single-column and composite indexes for real queries (leftmost prefix rule)",
      "Read EXPLAIN output to confirm whether an index is used",
      "Weigh the write and storage cost of every extra index",
    ],
    technicalDefinition:
      "A database index is an auxiliary data structure, most commonly a B-tree, that keeps the values of one or more columns in sorted order with pointers to the corresponding rows, allowing the engine to locate, range-scan and sort matching rows in logarithmic time instead of scanning the entire table, at the cost of extra storage and slower writes.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Index** database ka shortcut hai jisse kisi column pe search **bahut fast** ho jaata hai.

Bina index ke \`SELECT * FROM users WHERE email = 'asha@x.com'\` chalane pe DB ko **har row** check karni padti hai — 1 crore rows to 1 crore checks. Isse **full table scan** (Postgres mein "Seq Scan") kehte hain.

Index ek alag, **sorted** structure hai (usually **B-tree**) jisme \`email\` values order mein rakhi hoti hain aur har value ke saath row ka pata (pointer). Ab DB sorted structure mein seedha jump karke kuch hi steps mein row dhundh leta hai.

\`\`\`sql
CREATE INDEX idx_users_email ON users (email);
\`\`\`

Bas itna samjho: index = **reads fast**, par **writes thode slow** aur extra disk space.`,
          en: `An **index** is a database shortcut that makes searching on a column **much faster**.

Without one, \`SELECT * FROM users WHERE email = 'asha@x.com'\` checks **every row**: ten million rows means ten million checks. This is a **full table scan** ("Seq Scan" in Postgres).

An index is a separate **sorted** structure, usually a **B-tree**, storing the column's values in order with pointers to rows. The database jumps through it in a few steps.

Create one with \`CREATE INDEX idx_users_email ON users (email);\`. Remember: faster reads, slightly slower writes, extra space.`,
          hi: `**Index** database का शॉर्टकट है जिससे किसी column पर खोज **बहुत तेज़** हो जाती है।

बिना index के \`SELECT * FROM users WHERE email = 'asha@x.com'\` चलाने पर database को **हर row** जाँचनी पड़ती है — एक करोड़ rows यानी एक करोड़ जाँच। इसे **full table scan** कहते हैं।

Index एक अलग, **क्रमबद्ध** ढाँचा है (आमतौर पर **B-tree**) जिसमें \`email\` के मान क्रम में रखे होते हैं और हर मान के साथ row का पता। अब database कुछ ही कदमों में row ढूँढ लेता है।

याद रखें: index = **पढ़ना तेज़**, पर **लिखना थोड़ा धीमा** और अतिरिक्त जगह।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Mobile ki contact list** socho. Contacts **alphabetically sorted** hain. "Rohit" dhundhna hai to tum "R" pe jump karte ho, phir "Ro..." — do second mein mil gaya. Ye index hai.

Ab socho contacts kisi order mein nahi hain — jis din save kiye, usi order mein 2000 naam. "Rohit" ke liye upar se neeche har naam padhna padega. Ye **full table scan** hai.

Ek aur example: **textbook ke peeche ka index page**. "Photosynthesis — page 142, 167". Tum poori book nahi padhte, index dekh ke seedha page 142 kholte ho.

Par dhyan do: har nayi chapter jodne pe index page bhi update karna padta hai (**writes slow**), aur index page khud bhi jagah leta hai (**storage**). Isliye har shabd ka index nahi banate — sirf jo log sach mein dhundhte hain.`,
          en: `Think of your **phone's contact list**. Contacts are sorted alphabetically, so to find "Rohit" you jump to "R", then "Ro", and you are done in seconds. That is an index.

If contacts were stored in the order you saved them, you would read all 2000 names top to bottom. That is a **full table scan**.

A **textbook's back-of-book index** works the same way: "Photosynthesis, pages 142, 167". But every new chapter means updating the index (**slower writes**), and the index takes pages too (**storage**). So you only index words people actually look up.`,
          hi: `अपने **फ़ोन की contact list** सोचिए। Contacts **वर्णानुक्रम** में हैं। "रोहित" ढूँढना है तो आप सीधे "R" पर जाते हैं — दो सेकंड में मिल गया। यही index है।

अगर contacts किसी क्रम में न हों, तो "रोहित" के लिए ऊपर से नीचे हर नाम पढ़ना पड़ेगा। यही **full table scan** है।

**पाठ्यपुस्तक के पीछे की अनुक्रमणिका** भी ऐसी ही है: "प्रकाश संश्लेषण — पृष्ठ 142"। पर हर नया अध्याय जोड़ने पर अनुक्रमणिका भी बदलनी पड़ती है (**लिखना धीमा**), और वह खुद जगह भी लेती है। इसलिए हर शब्द का index नहीं बनाते।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Development mein table mein 50 rows hoti hain, sab fast lagta hai. Production mein 5 crore rows, aur wahi query 8 second leti hai. Users ko page loading spinner dikhta hai, DB ka CPU 100% — aur baaki queries bhi slow ho jaati hain kyunki sab ek hi DB share kar rahe hain.

Indexes ye problem solve karte hain:
- **Lookup**: \`WHERE email = ?\` — login ke time.
- **Range**: \`WHERE created_at > now() - interval '7 days'\`.
- **Sorting**: \`ORDER BY created_at DESC LIMIT 20\` — index pehle se sorted hai, DB ko sort nahi karna padta.
- **Uniqueness**: \`UNIQUE\` index duplicate email ko DB level pe hi rok deta hai.
- **Joins**: \`orders.user_id\` pe index se join fast.

B-tree mein search ka cost **O(log n)** hai: 10 lakh rows pe ~20 comparisons, 1 crore pe ~24. Full scan O(n) hai. Ye farak hi "8 second" aur "5 millisecond" ka farak hai.`,
          en: `In development a table has 50 rows and everything is fast. In production it has 50 million and the same query takes 8 seconds, the database CPU hits 100% and other queries slow down too.

Indexes help with:
- **Lookups** like \`WHERE email = ?\` at login.
- **Ranges** like the last 7 days.
- **Sorting**: an index is already sorted, so \`ORDER BY ... LIMIT 20\` avoids a sort.
- **Uniqueness**: a \`UNIQUE\` index blocks duplicates.
- **Joins** on foreign keys.

A B-tree lookup is **O(log n)**: about 20 comparisons for a million rows, versus O(n) for a scan.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Real systems mein indexes:

- **Login (har app mein)**: \`users.email\` ya \`users.phone\` pe **unique index** — taaki login lookup fast ho aur duplicate account na bane.
- **Order history (Swiggy/Zomato type app)**: "meri orders, latest pehle" → composite index \`(user_id, created_at DESC)\`. Ek user ki latest 20 orders bina poori table padhe mil jaati hain.
- **GitLab** jaise open-source projects apne database guidelines publicly rakhte hain — naya index add karne pe review hota hai, aur bade tables pe \`CREATE INDEX CONCURRENTLY\` use karte hain taaki writes block na hon.
- **E-commerce search filters**: \`(category_id, price)\` index — "Mobiles under ₹20,000" jaise filters ke liye.

Har jagah pattern: jo query **sabse zyada chalti hai**, uske \`WHERE\` aur \`ORDER BY\` ke hisaab se index.`,
          en: `Indexes in real systems:

- **Login**: a **unique index** on \`users.email\` or \`users.phone\` makes lookups fast and blocks duplicate accounts.
- **Order history** in a food-delivery app: a composite index on \`(user_id, created_at DESC)\` returns a user's latest 20 orders without reading the whole table.
- **GitLab** publishes database guidelines: new indexes are reviewed and large tables use \`CREATE INDEX CONCURRENTLY\` to avoid blocking writes.
- **E-commerce filters**: \`(category_id, price)\` for "phones under ₹20,000".

The pattern: index for the \`WHERE\` and \`ORDER BY\` of your most frequent queries.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `**B-tree** ek balanced, sorted tree hai:

1. **Root node** mein kuch keys hoti hain jo range batati hain: "A–F idhar, G–M udhar, N–Z us taraf".
2. **Internal nodes** range ko aur chhota karte hain.
3. **Leaf nodes** mein actual values sorted order mein + row ka pointer (Postgres mein TID). Leaves aapas mein linked hoti hain — isliye **range scan** (\`BETWEEN\`, \`>\`) aur **ORDER BY** fast.

Har node ek disk page (~8 KB) hota hai jisme sainkdon keys aati hain, isliye tree bahut **shallow** hota hai — crore rows pe bhi 3–4 levels.

**Composite index** \`(city, created_at)\` pehle \`city\` se sort hota hai, phir har city ke andar \`created_at\` se. Isliye ye \`WHERE city = ?\` aur \`WHERE city = ? ORDER BY created_at\` mein kaam aata hai, par sirf \`WHERE created_at > ?\` mein nahi — ise **leftmost prefix rule** kehte hain (jaise phone book first name se nahi dhundh sakte agar surname se sorted hai).

Insert/update pe DB ko index bhi update karna padta hai — yahi write cost hai.`,
          en: `A **B-tree** is a balanced, sorted tree:

1. The **root** splits the key range.
2. **Internal nodes** narrow it further.
3. **Leaves** hold sorted values with row pointers and are linked, so **range scans** and **ORDER BY** are fast.

Each node is a disk page holding hundreds of keys, so even huge tables have only 3–4 levels.

A **composite index** \`(city, created_at)\` sorts by city, then by time within each city. It serves \`WHERE city = ?\` and \`WHERE city = ? ORDER BY created_at\`, but not \`WHERE created_at > ?\` alone: the **leftmost prefix rule**. Every write must also update the index.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `**JavaScript** version index ka jaadu **gin ke** dikhata hai (time nahi, kyunki time machine pe depend karta hai):

- 1,00,000 fake users banaye.
- **Full scan**: har row check karo, \`comparisons\` gino.
- **Index**: emails ko sort karke \`[email, rowId]\` ki sorted list banayi (B-tree ki leaf level jaisi), phir **binary search** — har step mein aadha hissa hata do.
- Dono same row dhundhte hain, par comparisons mein zameen-aasmaan ka farak.

**Python** version asli **SQLite** use karta hai:
- 20,000 rows insert, phir \`EXPLAIN QUERY PLAN\` — pehle \`SCAN\` (full scan) dikhega.
- \`CREATE INDEX\` ke baad wahi query \`SEARCH ... USING INDEX\` dikhayegi.

Real Postgres mein bhi yahi karte ho: \`EXPLAIN ANALYZE SELECT ...\` → "Seq Scan" vs "Index Scan".`,
          en: `The **JavaScript** version shows the index effect by **counting** comparisons, not timing:

- It creates 100,000 fake users.
- A **full scan** checks every row.
- The **index** is a sorted list of \`[email, rowId]\` pairs (like a B-tree leaf level) searched with **binary search**.
- Both find the same row with very different comparison counts.

The **Python** version uses real **SQLite**: \`EXPLAIN QUERY PLAN\` shows \`SCAN\` before the index and \`SEARCH ... USING INDEX\` after \`CREATE INDEX\`. In Postgres you would use \`EXPLAIN ANALYZE\`.`,
        },
        codeJs: `const N = 100000;
const users = [];
for (let i = 0; i < N; i++) {
  // emails are stored in insertion order, NOT sorted
  users.push({ id: i + 1, email: "user" + ((i * 7919) % N) + "@mail.com" });
}
const target = "user4242@mail.com";

// 1) Full table scan
let scanComparisons = 0;
let scanHit = null;
for (const row of users) {
  scanComparisons++;
  if (row.email === target) { scanHit = row; break; }
}

// 2) Build an index: sorted [email, rowIndex] pairs (like B-tree leaves)
const index = users.map((u, i) => [u.email, i]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

let indexComparisons = 0;
let lo = 0, hi = index.length - 1, indexHit = null;
while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  indexComparisons++;
  if (index[mid][0] === target) { indexHit = users[index[mid][1]]; break; }
  if (index[mid][0] < target) lo = mid + 1; else hi = mid - 1;
}

console.log("full scan  -> id", scanHit.id, "after", scanComparisons, "comparisons");
console.log("with index -> id", indexHit.id, "after", indexComparisons, "comparisons");
console.log("log2(" + N + ") is about", Math.ceil(Math.log2(N)));
`,
        codePython: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, city TEXT)")
cities = ["Pune", "Delhi", "Mumbai", "Jaipur"]
db.executemany(
    "INSERT INTO users (email, city) VALUES (?, ?)",
    ((f"user{(i * 7919) % 20000}@mail.com", cities[i % 4]) for i in range(20000)),
)

query = "SELECT id, city FROM users WHERE email = ?"


def plan(sql):
    rows = db.execute("EXPLAIN QUERY PLAN " + sql, ("user4242@mail.com",)).fetchall()
    return " | ".join(r[-1] for r in rows)


print("before index:", plan(query))
db.execute("CREATE INDEX idx_users_email ON users (email)")
print("after index: ", plan(query))
print("result:", db.execute(query, ("user4242@mail.com",)).fetchone())
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Indexes ke saath common galtiyan:

- **Har column pe index**: 12 indexes wali table pe har \`INSERT\` 12 structures update karta hai — writes slow, disk full. Sirf real queries ke liye banao.
- **Composite index ka galat order**: query \`WHERE user_id = ? ORDER BY created_at\` hai aur index \`(created_at, user_id)\` bana diya — leftmost prefix match nahi hua, index kaam nahi aaya.
- **Column pe function**: \`WHERE LOWER(email) = ?\` — normal \`email\` index use nahi hoga. Ya to data lowercase store karo ya expression index banao.
- **Leading wildcard**: \`LIKE '%kumar'\` — B-tree shuru se match karta hai, isliye bekaar. \`LIKE 'kumar%'\` chal sakta hai.
- **Foreign key pe index bhoolna**: \`orders.user_id\` pe index nahi → har join/delete slow.
- **Production pe \`CREATE INDEX\` bina CONCURRENTLY** (Postgres): badi table pe writes lock ho jaate hain.
- **Bina EXPLAIN ke maan lena** ki index use ho raha hai.`,
          en: `Common index mistakes:

- **Indexing every column**: each insert then updates every index.
- **Wrong composite order**: for \`WHERE user_id = ? ORDER BY created_at\`, index \`(user_id, created_at)\`, not the reverse.
- **Functions on the column**: \`LOWER(email)\` skips a plain index; store lowercase or add an expression index.
- **Leading wildcards** like \`LIKE '%kumar'\` cannot use a B-tree.
- **Unindexed foreign keys** slow joins and deletes.
- **\`CREATE INDEX\` without \`CONCURRENTLY\`** on big Postgres tables blocks writes.
- **Assuming** an index is used without checking \`EXPLAIN\`.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Slow query ko index se kaise theek karein — step by step:

1. **Slow query dhundho**: Postgres mein \`pg_stat_statements\`, ya slow query log (\`log_min_duration_statement\`), ya APM tool.
2. **Plan dekho**:

\`\`\`sql
EXPLAIN ANALYZE
SELECT id, total FROM orders
WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;
\`\`\`

3. **Plan padho**: "Seq Scan on orders" + "Rows Removed by Filter: 4999980" = poori table padhi, almost sab phenk di. Ye index ki zaroorat ka signal hai. "Sort" node bhi dikhe to ORDER BY ke liye bhi index chahiye.
4. **Index banao**: \`CREATE INDEX CONCURRENTLY idx_orders_user_created ON orders (user_id, created_at DESC);\`
5. **Dobara EXPLAIN ANALYZE**: ab "Index Scan using idx_orders_user_created" aur time ms mein.
6. **Index use nahi ho raha?** Function on column, type mismatch (\`user_id = '42'\` text vs bigint), ya table bahut chhoti hai (planner ko scan sasta lagta hai) — ye check karo. \`ANALYZE\` se statistics update karo.`,
          en: `Fixing a slow query with an index:

1. **Find it** with \`pg_stat_statements\`, the slow query log or an APM tool.
2. Run \`EXPLAIN ANALYZE\` on it.
3. "Seq Scan" with millions of "Rows Removed by Filter" signals a missing index; a "Sort" node means ORDER BY needs it too.
4. Create it with \`CREATE INDEX CONCURRENTLY ... (user_id, created_at DESC)\`.
5. Re-run \`EXPLAIN ANALYZE\` and expect an Index Scan.
6. Still unused? Check functions on the column, type mismatches, tiny tables, and refresh statistics with \`ANALYZE\`.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Index free nahi hai:

- **Write cost**: har INSERT/UPDATE/DELETE ko har related index update karna padta hai. Write-heavy tables (logs, events) pe kam indexes rakho.
- **Storage aur memory**: indexes disk lete hain, aur fast rehne ke liye RAM (cache) mein fit hone chahiye.
- **Low-selectivity columns**: \`is_active\` (sirf true/false) ya \`gender\` pe index aksar bekaar — aadhi table match karti hai, planner scan hi chunega. Yahan **partial index** (\`WHERE is_active = true\`) better ho sakta hai.
- **Chhoti tables**: 500 rows pe index se zyada farak nahi padta.
- **Alternatives**: full-text search ke liye GIN index ya Elasticsearch; JSONB ke liye GIN; analytics ke liye columnar DB; bahut hot reads ke liye **cache** (Redis).

Rule of thumb: index **queries ke liye** banao, columns ke liye nahi. Aur unused indexes (\`pg_stat_user_indexes\` mein idx_scan = 0) hata do.`,
          en: `Indexes are not free:

- **Write cost**: every insert, update and delete updates each index; keep write-heavy tables lean.
- **Storage and memory**: indexes need disk and should fit in RAM.
- **Low-selectivity columns** like booleans are rarely worth a full index; consider a **partial index**.
- **Tiny tables** barely benefit.
- **Alternatives**: GIN indexes or Elasticsearch for text search, columnar databases for analytics, a Redis cache for hot reads.

Index for **queries**, not columns, and drop unused indexes.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek real project mein indexes migration files mein rehte hain, review ke saath:

\`\`\`sql
-- login lookup + no duplicate accounts
CREATE UNIQUE INDEX idx_users_email ON users (lower(email));

-- "My orders" screen: WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);

-- admin dashboard only cares about pending orders
CREATE INDEX idx_orders_pending ON orders (created_at) WHERE status = 'pending';
\`\`\`

Prisma mein yahi \`@@index([userId, createdAt(sort: Desc)])\` se likhte hain. PR description mein team likhti hai: kaunsi query ke liye index hai, EXPLAIN ANALYZE before/after, aur table size. Har quarter unused indexes ki list check hoti hai. Interview mein bhi "ye index kyun banaya?" ka jawab query ke saath dena — yahi maturity dikhata hai.`,
          en: `In a real project, indexes live in reviewed migration files: a unique index on \`lower(email)\` for login, a composite \`(user_id, created_at DESC)\` index for the "my orders" screen, and a partial index on pending orders for the admin dashboard. In Prisma this is \`@@index([userId, createdAt(sort: Desc)])\`.

Pull requests state which query the index serves, include \`EXPLAIN ANALYZE\` before and after and the table size, and the team periodically removes unused indexes.`,
        },
      },
    ],
    visualization: {
      kind: "TREE",
      title: "B-tree lookup for email = 'rohit@mail.com'",
      steps: [
        { title: "Start at the root", description: "Root keys: [g, n]. 'rohit' is after 'n', so follow the right child.", highlight: "root" },
        { title: "Internal node", description: "Keys: [p, s]. 'rohit' is between 'p' and 's', so follow the middle child.", highlight: "p ≤ r < s" },
        { title: "Leaf page", description: "Leaf holds sorted entries: priya, rahul, rohit, ruchi — each with a row pointer.", highlight: "leaf" },
        { title: "Follow the pointer", description: "rohit → row (page 812, slot 4). The database reads just that row from the table.", highlight: "row pointer" },
        { title: "Compare with a scan", description: "3 node reads instead of checking millions of rows one by one.", highlight: "O(log n) vs O(n)" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the main benefit of adding an index on users.email?",
        options: ["Emails are encrypted", "Queries filtering by email avoid a full table scan", "Inserts become faster", "The table uses less disk space"],
        correct: [1],
        explanation: "Index sorted structure hai, isliye \`WHERE email = ?\` seedha jump karta hai — poori table nahi padhni. Inserts thode **slow** hote hain aur space **zyada** lagta hai.",
        tags: ["basics"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "You have a composite index on (user_id, created_at). Which query can use it best?",
        options: [
          "SELECT * FROM orders WHERE created_at > '2025-01-01'",
          "SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20",
          "SELECT * FROM orders WHERE total > 500",
          "SELECT * FROM orders ORDER BY total",
        ],
        correct: [1],
        explanation: "**Leftmost prefix rule**: index pehle user_id se sorted hai, phir created_at se. \`user_id = 42\` se sahi hissa milta hai aur wahan created_at already sorted hai — sort bhi bach gaya.",
        tags: ["composite-index"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the main cost of having many indexes on a table?",
        options: ["SELECT queries become slower", "Writes (INSERT/UPDATE/DELETE) become slower and more storage is used", "The table cannot have a primary key", "Joins stop working"],
        correct: [1],
        explanation: "Har write pe har index update karna padta hai, aur har index disk/RAM leta hai. Isliye sirf zaroori indexes.",
        tags: ["tradeoffs"],
      },
      {
        type: "MULTI",
        difficulty: 3,
        prompt: "Which of these WHERE clauses usually CANNOT use a plain B-tree index on the column? (Select all that apply)",
        options: ["WHERE LOWER(email) = 'a@b.com' (index on email)", "WHERE name LIKE '%kumar' (index on name)", "WHERE id = 5 (primary key)", "WHERE email = 'a@b.com' (index on email)"],
        correct: [0, 1],
        explanation: "Column pe function (\`LOWER\`) lagane se index ki sorted values match nahi hoti, aur **leading wildcard** (\`%kumar\`) shuru se search nahi kar sakta. Primary key aur simple equality index use karte hain.",
        tags: ["index-usage"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "An index lets the database binary-search sorted keys 0..1023. How many steps does this search take to find 700?",
        code: `steps = 0
lo, hi = 0, 1023
target = 700
while lo <= hi:
    steps += 1
    mid = (lo + hi) // 2
    if mid == target:
        break
    if mid < target:
        lo = mid + 1
    else:
        hi = mid - 1
print(steps)`,
        codeLanguage: "python",
        options: ["700", "1024", "10", "1"],
        correct: [2],
        explanation: "Binary search har step mein range aadhi karta hai: mid values 511 → 767 → 639 → 703 → 671 → 687 → 695 → 699 → 701 → 700, yaani **10 steps**. 1024 keys ke liye log2(1024) = 10, jabki full scan ko 701 checks lagte. Yahi index ki taakat hai.",
        tags: ["b-tree", "complexity"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "The 'My orders' page takes 6 seconds. The query is `SELECT ... FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20` on a 40-million-row table, and EXPLAIN shows a Seq Scan followed by a Sort. What do you do?",
        options: [
          "Add more RAM to the app server",
          "Create a composite index on (user_id, created_at DESC) concurrently, then confirm with EXPLAIN ANALYZE",
          "Create separate indexes on every column of orders",
          "Remove ORDER BY so the page loads faster",
        ],
        correct: [1],
        explanation: "Filter user_id pe hai aur sort created_at pe — composite index \`(user_id, created_at DESC)\` dono kaam karta hai: seedha user ki rows, pehle se sorted, sirf 20 padhni. \`CONCURRENTLY\` taaki production writes block na hon.",
        tags: ["performance"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps to fix a slow production query with an index.",
        options: [
          "Find the slow query using pg_stat_statements or slow query logs",
          "Run EXPLAIN ANALYZE and look for Seq Scan / Sort nodes",
          "Design an index that matches the WHERE and ORDER BY columns",
          "Create it with CREATE INDEX CONCURRENTLY in a migration",
          "Re-run EXPLAIN ANALYZE to confirm the index is used and time dropped",
        ],
        explanation: "Andaze se index mat banao: pehle data se slow query pakdo, plan padho, query ke hisaab se index design karo, safely banao, aur EXPLAIN se proof lo.",
        tags: ["process"],
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Why shouldn't you simply add an index on every column of a table?",
        keywords: ["slower writes", "storage", "update every index", "unused", "memory"],
        explanation: "Har index ko har write pe update karna padta hai (writes slow), disk aur RAM leta hai, aur zyada tar indexes kabhi use hi nahi hote. Index real queries ke liye banao.",
        tags: ["tradeoffs"],
      },
    ],
    buildTask: {
      title: "Build a simple column index",
      description: `Database index ka core idea: **value → kaunsi rows**. Likho \`buildIndex(rows, column)\` jo ek object return kare jisme har distinct value ke saamne un rows ke \`id\` ki list ho (rows jis order mein aayi, usi order mein).

- Jin rows mein wo column **missing ya null** hai, unhe skip karo.
- Values tests mein hamesha strings hain.

Example: \`buildIndex([{id:1,city:"Pune"},{id:2,city:"Delhi"},{id:3,city:"Pune"}], "city")\` → \`{ "Pune": [1, 3], "Delhi": [2] }\`

(Ye hash/inverted index jaisa hai. B-tree isi mapping ko sorted order mein rakhta hai taaki range queries bhi chal sakein.)`,
      functionName: "buildIndex",
      starterJs: `function buildIndex(rows, column) {
  const index = {};
  // for each row: add row.id under index[row[column]]
  return index;
}
`,
      starterPython: `def buildIndex(rows, column):
    index = {}
    # for each row: add row["id"] under index[row[column]]
    return index
`,
      tests: [
        { name: "groups ids by city", args: [[{ id: 1, city: "Pune" }, { id: 2, city: "Delhi" }, { id: 3, city: "Pune" }], "city"], expected: { Pune: [1, 3], Delhi: [2] } },
        { name: "empty table", args: [[], "email"], expected: {} },
        { name: "unique values", args: [[{ id: 7, email: "a@x.com" }, { id: 9, email: "b@x.com" }], "email"], expected: { "a@x.com": [7], "b@x.com": [9] } },
        { name: "skips missing column", args: [[{ id: 1, status: "paid" }, { id: 2 }, { id: 3, status: "paid" }], "status"], expected: { paid: [1, 3] } },
        { name: "keeps row order", args: [[{ id: 5, tag: "x" }, { id: 2, tag: "x" }, { id: 9, tag: "x" }], "tag"], expected: { x: [5, 2, 9] } },
        { name: "skips null values", args: [[{ id: 1, city: null }, { id: 2, city: "Goa" }], "city"], expected: { Goa: [2] }, hidden: true },
        { name: "many groups", args: [[{ id: 1, s: "a" }, { id: 2, s: "b" }, { id: 3, s: "c" }, { id: 4, s: "a" }, { id: 5, s: "b" }], "s"], expected: { a: [1, 4], b: [2, 5], c: [3] }, hidden: true },
      ],
      hints: [
        "Index = lookup table. Har value ek 'key' hai aur uske saamne matching row ids ki list — taaki baad mein bina scan kiye rows mil jaayein.",
        "Rows pe ek loop chalao. Value nikalo; agar undefined/null hai to continue. Agar index mein key nahi hai to khaali list banao, phir id push karo.",
        "JS: for (const row of rows) { const v = row[column]; if (v === undefined || v === null) continue; (index[v] = index[v] || []).push(row.id); }",
      ],
      explainQuestions: [
        { question: "After building this index, how many steps does a lookup for one value take compared with scanning all rows?", keywords: ["one lookup", "constant", "scan", "every row"] },
        { question: "What extra work does your index need when a new row is inserted or a row's city changes?", keywords: ["update index", "insert", "remove old", "write cost"] },
        { question: "Why can't this kind of hash-style index answer 'city between A and M' efficiently, while a B-tree can?", keywords: ["sorted", "range", "b-tree", "order"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "How does a B-tree index speed up queries?",
        short: "A B-tree keeps column values in sorted order in a shallow balanced tree whose leaves point to table rows. The database walks from root to leaf in a few page reads, O(log n), instead of scanning every row. Because leaves are sorted and linked, it also speeds up range queries and ORDER BY.",
        deep: `- Each node is a page (~8 KB) with hundreds of keys, so even 100M rows need only ~3–4 levels.
- Equality and range predicates (\`=\`, \`<\`, \`BETWEEN\`, \`LIKE 'abc%'\`) can use it; leading wildcards and functions on the column cannot (unless an expression index exists).
- An **index-only scan** can answer from the index alone if all needed columns are in it (covering index / \`INCLUDE\`).
- Writes must maintain the tree (page splits), which is the write cost.
- The planner may still choose a sequential scan if a large fraction of rows match.`,
        followUps: ["What is a covering index?", "Why might the planner ignore your index?", "B-tree vs hash index?"],
        commonMistake: "Saying indexes always make queries faster, ignoring low selectivity and write overhead.",
        keywords: ["sorted", "balanced tree", "log n", "range", "row pointer"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK", "SDE"],
      },
      {
        question: "What is a composite index and what is the leftmost prefix rule?",
        short: "A composite index covers multiple columns in a fixed order, sorting by the first column, then the second within it, and so on. A query can use it only if it filters on a leftmost prefix of those columns — an index on (a, b, c) helps queries on a, a+b, or a+b+c, but not on b or c alone.",
        deep: `- Put **equality** columns first, then the **range or sort** column: \`(user_id, created_at)\` for \`WHERE user_id = ? ORDER BY created_at\`.
- \`(a, b)\` can make a separate index on \`a\` redundant.
- Column order matters more than column choice; design from the actual query.
- Some databases support skip scans, but do not rely on them.`,
        followUps: ["Is an index on (a, b) the same as two indexes on a and b?", "Where would you put a range column in a composite index?"],
        commonMistake: "Creating (created_at, user_id) for a query that filters by user_id and sorts by created_at.",
        keywords: ["multiple columns", "order matters", "leftmost prefix", "equality first"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK"],
      },
    ],
    promptCard: {
      title: "Optimise my slow SQL query",
      category: "SQL",
      task: "Diagnose a slow SQL query from its EXPLAIN ANALYZE output and get specific index or rewrite suggestions with their trade-offs.",
      whenToUse: "When an endpoint is slow and you have identified the SQL query behind it.",
      template: `You are a senior database engineer specialising in [DATABASE] performance.

Slow query:
[QUERY]

EXPLAIN ANALYZE output:
[EXPLAIN_OUTPUT]

Table sizes and existing indexes:
[TABLES_AND_INDEXES]

How often this query runs and the write volume on these tables: [WORKLOAD]

1. Explain in simple words where the time is going, quoting the exact plan nodes.
2. Suggest the smallest change that fixes it (an index, a rewrite, or both). Give exact SQL, including CREATE INDEX CONCURRENTLY where relevant.
3. For each suggested index, explain column order (equality before range/sort) and the write/storage cost.
4. Tell me which existing indexes become redundant.
5. Tell me exactly what I should see in EXPLAIN ANALYZE after the change to confirm it worked.
Do not suggest changes you cannot justify from the plan; say if you need more information.`,
      variables: [
        { key: "DATABASE", label: "e.g. PostgreSQL 16, MySQL 8" },
        { key: "QUERY", label: "The exact slow SQL query" },
        { key: "EXPLAIN_OUTPUT", label: "Full EXPLAIN ANALYZE output" },
        { key: "TABLES_AND_INDEXES", label: "Row counts and current indexes (\\d table output)" },
        { key: "WORKLOAD", label: "e.g. runs 200/sec, 50 inserts/sec on orders" },
      ],
      whyItWorks: [
        { part: "Real EXPLAIN ANALYZE output", why: "Grounds the advice in the actual plan instead of generic 'add an index' tips." },
        { part: "Workload information", why: "Lets the model weigh read speed against write cost for each index." },
        { part: "Smallest change first", why: "Avoids over-engineering and index sprawl." },
        { part: "Expected plan after the fix", why: "Gives you a concrete way to verify the suggestion instead of trusting it." },
      ],
      verifyChecklist: [
        "Run the suggested change on a staging copy first",
        "EXPLAIN ANALYZE after the change shows the expected Index Scan and lower time",
        "Index column order matches equality-then-range/sort",
        "Large tables use CREATE INDEX CONCURRENTLY",
        "Write latency on the table did not regress noticeably",
      ],
      sampleOutput: `Time goes to "Seq Scan on orders (rows removed by filter: 39,999,980)" followed by "Sort (top-N heapsort)".
Fix: CREATE INDEX CONCURRENTLY idx_orders_user_created ON orders (user_id, created_at DESC);
user_id first (equality), created_at second (sort), so Postgres reads 20 index entries and skips the sort.
Cost: ~1.2 GB extra storage, slightly slower inserts. Existing idx_orders_user_id becomes redundant.
Expect: "Limit -> Index Scan using idx_orders_user_created", execution time under 5 ms.`,
    },
  },
  // ───────────────────────────── 7. Redis and caching ─────────────────────────────
  {
    slug: "redis-caching",
    estMinutes: 45,
    difficulty: 2,
    prerequisites: ["sql-basics", "rest-api-design"],
    objectives: [
      "Explain cache hits, misses and TTL using the cache-aside pattern",
      "Decide what data is safe to cache and for how long",
      "Invalidate cached data on writes to avoid stale responses",
      "Recognise cache stampedes and common Redis use cases beyond caching",
    ],
    technicalDefinition:
      "Caching stores copies of frequently read or expensive-to-compute data in a faster storage layer so later requests can be served without hitting the primary source; Redis is an in-memory key-value data store commonly used as such a cache, supporting per-key expiry (TTL), atomic operations and data structures like strings, hashes, lists, sets and sorted sets.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Caching** matlab: jo data baar-baar maanga jaata hai aur jise nikalna mehenga hai, uski ek copy **fast jagah** pe rakh lo, taaki agli baar seedha wahin se de do.

**Redis** ek **in-memory key-value store** hai — data RAM mein rehta hai, isliye reads usually ek millisecond se bhi kam mein ho jaate hain. Database disk + query processing karta hai, isliye usse slow hota hai.

Teen shabd yaad rakho:
- **Hit**: data cache mein mil gaya — fast jawab.
- **Miss**: cache mein nahi — DB se lao aur cache mein daal do.
- **TTL (time to live)**: kitni der baad copy apne aap expire ho jaaye, jaise \`SET menu:42 "..." EX 300\` (5 minute).

Cache asli data nahi hai — wo sirf ek **temporary copy** hai. Source of truth hamesha database hi rehta hai.`,
          en: `**Caching** means keeping a copy of frequently requested, expensive-to-fetch data in a **faster place**, so later requests are served from there.

**Redis** is an **in-memory key-value store**. Data lives in RAM, so reads usually take well under a millisecond, while a database pays for disk access and query processing.

Three words to remember:
- **Hit**: the data is in the cache.
- **Miss**: it is not, so you load it from the database and store it.
- **TTL**: how long a copy lives before expiring, e.g. \`SET menu:42 "..." EX 300\`.

A cache is only a **temporary copy**; the database stays the source of truth.`,
          hi: `**Caching** का मतलब है: जो डेटा बार-बार माँगा जाता है और जिसे निकालना महँगा है, उसकी एक प्रति **तेज़ जगह** पर रख लो, ताकि अगली बार सीधे वहीं से दे सको।

**Redis** एक **in-memory key-value store** है — डेटा RAM में रहता है, इसलिए पढ़ना आमतौर पर एक मिलीसेकंड से भी कम में हो जाता है।

तीन शब्द याद रखिए:
- **Hit**: डेटा cache में मिल गया।
- **Miss**: cache में नहीं है — database से लाओ और cache में रखो।
- **TTL**: कितनी देर बाद प्रति अपने आप समाप्त हो जाए।

Cache असली डेटा नहीं, सिर्फ़ एक **अस्थायी प्रति** है। सच्चाई का स्रोत हमेशा database ही है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Chai stall** socho. Har customer ke liye bhaiya doodh ubaal ke, patti daal ke, 5 minute mein fresh chai banaye — to lambi line lag jaayegi. Isliye wo ek **badi ketli** mein chai bana ke rakhte hain. Customer aaya → ketli se seedha glass mein → 10 second. Ye **cache hit** hai.

Ketli khaali ho gayi → nayi chai banani padegi (5 minute) → ye **cache miss** hai, aur nayi chai phir ketli mein.

Par ketli ki chai 30–40 minute baad thandi aur kadwi ho jaati hai, to bhaiya use phenk ke nayi banate hain — ye **TTL** hai.

Aur agar kisi din doodh badal gaya (data update hua), to purani ketli wali chai turant phenk do — ye **cache invalidation** hai. Warna customer ko purana, galat taste milega (stale data).`,
          en: `Think of a **chai stall**. Brewing fresh chai for every customer takes 5 minutes and creates a long queue, so the chaiwala keeps a **big kettle** ready. A customer arrives, chai goes straight into a glass in 10 seconds: a **cache hit**.

When the kettle is empty, fresh chai must be brewed: a **cache miss**, and the new batch goes back into the kettle.

After 30–40 minutes the kettle chai turns cold and bitter, so it is thrown away and remade: that is **TTL**. If the milk supplier changes (the data is updated), the old kettle is emptied immediately: **cache invalidation**, otherwise customers get stale chai.`,
          hi: `एक **चाय की टपरी** सोचिए। हर ग्राहक के लिए भैया दूध उबालकर 5 मिनट में ताज़ा चाय बनाएँ तो लंबी लाइन लग जाएगी। इसलिए वे एक **बड़ी केतली** में चाय बनाकर रखते हैं। ग्राहक आया → केतली से सीधे गिलास में → 10 सेकंड। यही **cache hit** है।

केतली खाली हो गई → नई चाय बनानी पड़ेगी → यह **cache miss** है, और नई चाय फिर केतली में।

केतली की चाय 30–40 मिनट बाद ठंडी हो जाती है, तो उसे फेंककर नई बनाते हैं — यही **TTL** है। और अगर दूध बदल गया (डेटा बदला), तो पुरानी चाय तुरंत फेंक दो — यही **cache invalidation** है।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Socho Zomato type app pe dinner time (8 baje) lakhon log ek hi popular restaurant ka menu khol rahe hain. Har request pe DB se menu + dishes + prices + ratings ka join chale → DB pe bhaari load, response 300 ms, aur peak pe DB gir bhi sakta hai.

Menu har second nahi badalta. To use Redis mein 5 minute ke liye rakh do:
- **Speed**: response 300 ms se ~5 ms.
- **DB load kam**: 1 lakh requests mein se DB tak shayad sirf kuch hi pahunchti hain (har TTL pe ek miss).
- **Cost**: chhota DB kaafi ho jaata hai, kam servers.
- **Spikes sambhalna**: IPL final ke time traffic 10x hua to bhi cache jhel leta hai.

Redis sirf cache nahi — **rate limiting counters**, **sessions**, **OTP store with expiry**, **leaderboards** (sorted sets) aur **queues** ke liye bhi use hota hai, kyunki wo fast hai aur atomic operations deta hai (\`INCR\`).`,
          en: `At 8 pm, huge numbers of people open the same popular restaurant menu. If every request joins menus, dishes, prices and ratings in the database, the DB is overloaded, responses take 300 ms, and it may fall over at peak.

Menus do not change every second, so caching them for 5 minutes gives:
- **Speed**: responses in a few milliseconds.
- **Less DB load**: only occasional misses reach the DB.
- **Lower cost** and the ability to absorb **traffic spikes**.

Redis is also used for **rate-limit counters**, **sessions**, **OTPs with expiry**, **leaderboards** and **queues**, thanks to atomic operations like \`INCR\`.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Caching real products mein:

- **Food delivery app (Zomato/Swiggy type)**: restaurant menus aur "popular near you" lists cache hoti hain kyunki ye baar-baar padhi jaati hain aur kam badalti hain.
- **Twitter/X** ne publicly bataya hai ki unki home timelines bade scale pe **Redis** mein store/serve hoti thi, taaki timeline kholte hi turant dikhe.
- **GitHub** apne engineering blog pe Redis use karne ke baare mein likh chuka hai (background jobs, caching jaise kaamon ke liye).
- **OTP login (bahut si Indian apps)**: OTP Redis mein \`SET otp:9876543210 482913 EX 300\` jaisa store hota hai — 5 minute baad apne aap gayab.
- **CDN (Cloudflare, Akamai)**: images, JS files ko user ke paas wale server pe cache karte hain — ye bhi caching hi hai, bas network ke edge pe.`,
          en: `Caching in real products:

- **Food-delivery apps** cache restaurant menus and "popular near you" lists, which are read often and change rarely.
- **Twitter/X** has publicly described serving home timelines from **Redis** at large scale.
- **GitHub** has written about using Redis for things like background jobs and caching.
- **OTP logins** store codes like \`SET otp:9876543210 482913 EX 300\` so they vanish after 5 minutes.
- **CDNs** like Cloudflare cache images and JS files near users, which is caching at the network edge.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Sabse common pattern hai **cache-aside** (lazy loading):

1. Request aayi: \`GET /restaurants/42/menu\`.
2. App Redis se poochta hai: \`GET menu:42\`.
3. **Hit** → seedha return.
4. **Miss** → DB query → result ko \`SET menu:42 <json> EX 300\` → return.
5. Menu update hua → \`DEL menu:42\` (invalidation), taaki agli request fresh data le.

Redis andar se:
- Data RAM mein, ek **single-threaded event loop** commands chalata hai — isliye har command atomic hai, race condition kam.
- **Expiry**: har key ke saath expire time; Redis expired keys ko access pe aur background sampling se hataata hai.
- **Memory full** ho to \`maxmemory-policy\` decide karta hai kya hatana hai, jaise \`allkeys-lru\` (sabse kam recently used key hatao).
- **Persistence** optional hai (RDB snapshots, AOF log) — par cache ke liye data khona chalega, kyunki DB mein asli data hai.`,
          en: `The most common pattern is **cache-aside**:

1. A request asks for \`GET /restaurants/42/menu\`.
2. The app runs \`GET menu:42\` on Redis.
3. On a **hit**, return it.
4. On a **miss**, query the DB, \`SET menu:42 <json> EX 300\`, return.
5. When the menu changes, \`DEL menu:42\`.

Inside Redis, data is in RAM and a **single-threaded event loop** runs commands, so each command is atomic. Keys can carry an expiry. When memory is full, \`maxmemory-policy\` (e.g. \`allkeys-lru\`) evicts keys. Persistence is optional; a cache can afford to lose data.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yahan Redis nahi chala rahe — ek **chhota TTL cache** banaya hai aur ek **fake clock** (\`now\`) taaki output har baar same aaye:

- \`TTLCache\` ek \`Map\` hai jisme har value ke saath \`expiresAt\` store hai. \`get\` mein agar time nikal gaya to key hata ke \`null\` (miss).
- \`fetchMenuFromDb\` slow DB jaisa hai — har call pe \`dbCalls\` badhta hai.
- \`getMenu(id)\` **cache-aside** hai: pehle cache, miss pe DB, phir cache mein TTL ke saath.
- \`updatePrice\` DB update karta hai aur **cache key delete** karta hai (invalidation).

Output dekho: pehli call miss (DB), agli do hit, TTL ke baad phir miss, aur price update ke baad turant naya data. Real Node mein yahi \`await redis.get(key)\` aur \`await redis.set(key, json, { EX: 300 })\` se hota.`,
          en: `No real Redis here: a **small TTL cache** plus a **fake clock** (\`now\`) keeps the output deterministic.

- \`TTLCache\` stores each value with \`expiresAt\`; an expired key is deleted and treated as a miss.
- \`fetchMenuFromDb\` stands in for a slow DB and counts \`dbCalls\`.
- \`getMenu(id)\` is **cache-aside**: cache first, DB on a miss, then store with TTL.
- \`updatePrice\` updates the DB and **deletes the cache key**.

The output shows a miss, two hits, a miss after expiry, and fresh data right after the update. Real code would use \`redis.get\` and \`redis.set(key, json, { EX: 300 })\`.`,
        },
        codeJs: `let now = 0; // fake clock in seconds
let dbCalls = 0;
const db = { 42: { name: "Shree Sagar", dosaPrice: 90 } };

class TTLCache {
  constructor() { this.store = new Map(); }
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (now >= entry.expiresAt) { this.store.delete(key); return null; }
    return entry.value;
  }
  set(key, value, ttlSeconds) { this.store.set(key, { value, expiresAt: now + ttlSeconds }); }
  del(key) { this.store.delete(key); }
}

const cache = new TTLCache();

function fetchMenuFromDb(id) {
  dbCalls++;
  return JSON.stringify(db[id]);
}

function getMenu(id) {
  const key = "menu:" + id;
  const cached = cache.get(key);
  if (cached) return "HIT  " + cached;
  const fresh = fetchMenuFromDb(id);
  cache.set(key, fresh, 300);
  return "MISS " + fresh;
}

function updatePrice(id, price) {
  db[id].dosaPrice = price;
  cache.del("menu:" + id); // invalidate on write
}

console.log("t=0   ", getMenu(42));
now = 10;  console.log("t=10  ", getMenu(42));
now = 299; console.log("t=299 ", getMenu(42));
now = 300; console.log("t=300 ", getMenu(42));
now = 320; updatePrice(42, 110);
console.log("t=320 ", getMenu(42));
console.log("DB calls:", dbCalls, "out of 5 requests");
`,
        codePython: `import json

now = 0  # fake clock in seconds
db_calls = 0
db = {42: {"name": "Shree Sagar", "dosaPrice": 90}}


class TTLCache:
    def __init__(self):
        self.store = {}

    def get(self, key):
        entry = self.store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if now >= expires_at:
            del self.store[key]
            return None
        return value

    def set(self, key, value, ttl_seconds):
        self.store[key] = (value, now + ttl_seconds)

    def delete(self, key):
        self.store.pop(key, None)


cache = TTLCache()


def fetch_menu_from_db(rid):
    global db_calls
    db_calls += 1
    return json.dumps(db[rid])


def get_menu(rid):
    key = f"menu:{rid}"
    cached = cache.get(key)
    if cached:
        return "HIT  " + cached
    fresh = fetch_menu_from_db(rid)
    cache.set(key, fresh, 300)
    return "MISS " + fresh


def update_price(rid, price):
    db[rid]["dosaPrice"] = price
    cache.delete(f"menu:{rid}")  # invalidate on write


print("t=0   ", get_menu(42))
now = 10
print("t=10  ", get_menu(42))
now = 299
print("t=299 ", get_menu(42))
now = 300
print("t=300 ", get_menu(42))
now = 320
update_price(42, 110)
print("t=320 ", get_menu(42))
print("DB calls:", db_calls, "out of 5 requests")
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Caching ki common galtiyan:

- **TTL na lagana**: key hamesha ke liye padi rahi → stale data aur memory bharti gayi.
- **Write pe invalidate bhoolna**: admin ne price badla, users ko 10 minute purana price dikh raha hai.
- **User-specific data ko shared key mein daalna**: \`cache key = "profile"\` rakha aur Asha ka profile Ravi ko dikh gaya! Key mein hamesha user/tenant id daalo: \`profile:user:7\`. Ye **security bug** hai.
- **Har cheez cache karna**: payment status, wallet balance jaise strongly-consistent data ko cache karna risky hai.
- **Cache ko source of truth maanna**: Redis restart hua aur data gaya — DB mein tha hi nahi.
- **Badi values**: 5 MB ka JSON ek key mein → network aur memory dono pe bhaari.
- **Redis down hone pe app crash**: cache optional layer hai — Redis fail ho to DB se serve karo (graceful fallback).`,
          en: `Common caching mistakes:

- **No TTL**, so keys live forever and go stale.
- **Forgetting to invalidate on writes**, showing old prices.
- **Shared keys for user-specific data**, like \`profile\`, leaking one user's data to another; include user or tenant ids in keys. This is a **security bug**.
- **Caching strongly consistent data** like wallet balances.
- **Treating the cache as the source of truth**.
- **Huge values** in a single key.
- **Crashing when Redis is down** instead of falling back to the DB.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Cache se related problems kaise pakdein:

1. **"Purana data dikh raha hai"**: \`redis-cli\` se key dekho aur uska bacha hua time:

\`\`\`bash
redis-cli GET menu:42
redis-cli TTL menu:42
\`\`\`

TTL -1 aaye matlab expiry hai hi nahi! Phir check karo update wale code path mein \`DEL\` ho raha hai ya nahi.
2. **Hit rate measure karo**: har hit/miss pe metric bhejo. Hit rate 20% hai to cache se fayda kam hai — key design ya TTL galat ho sakta hai. Redis \`INFO stats\` mein \`keyspace_hits\`/\`keyspace_misses\` deta hai.
3. **Galat user ka data dikha**: cache key mein user id hai? Ye sabse pehle check karo.
4. **Memory full / evictions**: \`INFO memory\` aur \`evicted_keys\` dekho. Badi keys dhundhne ke liye \`redis-cli --bigkeys\`.
5. **Debug mode**: response header \`X-Cache: HIT/MISS\` add karo — DevTools mein turant dikhega.`,
          en: `Debugging caches:

1. **Stale data**: check the key with \`redis-cli GET menu:42\` and \`TTL menu:42\`. A TTL of -1 means no expiry. Then confirm the update path deletes the key.
2. **Measure hit rate** with metrics or Redis \`INFO stats\` (\`keyspace_hits\`, \`keyspace_misses\`). A low hit rate suggests a bad key design or TTL.
3. **Wrong user's data**: check that the key includes the user id.
4. **Memory pressure**: look at \`INFO memory\`, \`evicted_keys\` and \`redis-cli --bigkeys\`.
5. Add an \`X-Cache: HIT/MISS\` response header for quick checks in DevTools.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Cache lagane se pehle socho — "There are only two hard things in computer science: cache invalidation and naming things":

- **Staleness vs speed**: lamba TTL = zyada hits, par purana data zyada der. Chhota TTL = fresh data, kam fayda.
- **Complexity**: ek aur system chalana, monitor karna, invalidation ke bugs.
- **Consistency**: DB update aur cache delete ke beech race ho sakti hai. Paisa, inventory, payment status jaise data ke liye seedha DB padho.
- **Pehle query theek karo**: slow query ka asli ilaaj aksar **index** hai. Cache se problem chhup jaati hai, solve nahi hoti.
- **Cache stampede**: popular key expire hui aur 10,000 requests ek saath DB pe gayi. Bachao: lock/single-flight (sirf ek request DB jaaye), TTL mein random jitter, ya expire hone se pehle background refresh.
- **Alternatives**: HTTP caching (\`Cache-Control\`, CDN) static/public data ke liye; app ke andar in-process cache (bahut chhota data, single server).`,
          en: `Think before adding a cache:

- **Staleness vs speed**: longer TTLs mean more hits but older data.
- **Complexity**: another system to run, monitor and invalidate correctly.
- **Consistency**: races between DB writes and cache deletes; read money and inventory from the DB.
- **Fix the query first**: a missing **index** is often the real problem.
- **Cache stampede**: a hot key expires and thousands of requests hit the DB. Use locks or single-flight, TTL jitter, or background refresh.
- **Alternatives**: HTTP/CDN caching for public data, or an in-process cache for tiny data.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real Express project mein cache-aside helper kuch aisa hota hai:

\`\`\`js
async function cached(key, ttlSeconds, loader) {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);
  } catch (e) { logger.warn("redis down, using DB", e); }
  const fresh = await loader();
  redis.set(key, JSON.stringify(fresh), { EX: ttlSeconds }).catch(() => {});
  return fresh;
}

app.get("/restaurants/:id/menu", async (req, res) => {
  const menu = await cached("menu:v1:" + req.params.id, 300, () => menuRepo.find(req.params.id));
  res.json(menu);
});
\`\`\`

Dhyaan do: key mein **version** (\`v1\`) — format badle to \`v2\` karke purana cache apne aap bekaar. Redis down ho to DB se chalta rehta hai. Menu update service \`DEL menu:v1:42\` karti hai. Dashboard pe hit rate aur Redis memory ka graph.`,
          en: `A real Express project wraps cache-aside in a helper \`cached(key, ttl, loader)\`: try \`redis.get\`, parse on a hit, otherwise call the loader, store the result with \`EX\` and return it. Redis errors are logged and the code falls back to the database.

The menu route calls \`cached("menu:v1:" + id, 300, () => menuRepo.find(id))\`. The **version** in the key lets you change the format by bumping to \`v2\`. The menu update path runs \`DEL\` on the key, and dashboards track hit rate and Redis memory.`,
        },
      },
    ],
    visualization: {
      kind: "REQUEST_RESPONSE",
      title: "Cache-aside: miss, hit and invalidation",
      steps: [
        { title: "Request arrives", description: "GET /restaurants/42/menu reaches the API server.", highlight: "GET" },
        { title: "Check Redis", description: "Server runs GET menu:42. First time: nothing there — a cache miss.", highlight: "MISS" },
        { title: "Load from DB and store", description: "Server queries the database, then SET menu:42 <json> EX 300.", highlight: "SET ... EX 300" },
        { title: "Next requests hit", description: "For the next 5 minutes, GET menu:42 returns the JSON in about a millisecond — no DB query.", highlight: "HIT" },
        { title: "Write invalidates", description: "Owner updates a price; the server updates the DB and runs DEL menu:42 so the next read is fresh.", highlight: "DEL" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "In the cache-aside pattern, what does the app do on a cache miss?",
        options: [
          "Returns 404 to the client",
          "Reads from the database, stores the result in the cache with a TTL, and returns it",
          "Waits until the cache fills itself",
          "Deletes the database row",
        ],
        correct: [1],
        explanation: "Miss pe app khud DB se data laata hai, cache mein TTL ke saath rakhta hai, aur return karta hai. Agli request hit hogi.",
        tags: ["cache-aside"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Why do we usually set a TTL on cached keys?",
        options: [
          "To make Redis use more memory",
          "To limit how long stale data can be served and to free memory automatically",
          "Because Redis cannot store keys without TTL",
          "To make database queries slower",
        ],
        correct: [1],
        explanation: "TTL ek **safety net** hai: invalidation miss bhi ho jaaye to data max TTL tak hi purana rahega, aur bekaar keys apne aap hat jaati hain.",
        tags: ["ttl"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "A very popular cached key expires and thousands of requests hit the database at the same moment. What is this called?",
        options: ["Cache stampede (thundering herd)", "Cache hit", "Write-through", "Sharding"],
        correct: [0],
        explanation: "Ise **cache stampede** kehte hain. Bachav: sirf ek request ko DB pe jaane do (lock/single-flight), TTL mein random jitter, ya expire hone se pehle refresh.",
        tags: ["stampede"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these are generally good candidates for caching? (Select all that apply)",
        options: [
          "A restaurant's menu",
          "The list of trending products on the home page",
          "A user's wallet balance used to approve a payment",
          "A product detail page's static information",
        ],
        correct: [0, 1, 3],
        explanation: "Menu, trending list aur product info baar-baar padhe jaate hain aur thoda purana chal jaata hai. **Wallet balance** pe payment decide karna ho to hamesha DB se fresh padho — stale value se paisa galat kat sakta hai.",
        tags: ["what-to-cache"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "This TTL cache uses a fake clock. What does it print?",
        code: `const cache = new Map();
let now = 0;
function set(k, v, ttl) { cache.set(k, { v, exp: now + ttl }); }
function get(k) {
  const e = cache.get(k);
  if (!e || now >= e.exp) { cache.delete(k); return "MISS"; }
  return e.v;
}
set("menu", "v1", 100);
const out = [get("menu")];
now = 99; out.push(get("menu"));
now = 100; out.push(get("menu"));
set("menu", "v2", 100);
out.push(get("menu"));
console.log(out.join(" "));`,
        codeLanguage: "javascript",
        options: ["v1 v1 MISS v2", "v1 v1 v1 v2", "v1 MISS MISS v2", "v1 v1 MISS MISS"],
        correct: [0],
        explanation: "t=0 aur t=99 pe entry valid (exp = 100) → v1, v1. t=100 pe \`now >= exp\` → MISS. Phir naya set (exp = 200) → v2.",
        tags: ["ttl"],
      },
      {
        type: "SCENARIO",
        difficulty: 2,
        prompt: "After a restaurant owner updates a dish price, customers keep seeing the old price for up to 10 minutes. The menu is cached with a 10-minute TTL. What is the best fix?",
        options: [
          "Remove caching for every endpoint",
          "Delete (or update) the menu cache key in the same code path that updates the price, and keep the TTL as a safety net",
          "Increase the TTL to 1 hour",
          "Tell owners to update prices only at midnight",
        ],
        correct: [1],
        explanation: "Write pe **invalidation** karo: price update ke baad \`DEL menu:42\`. Agli read fresh data laayegi. TTL backup ke liye rehne do, agar kabhi delete fail ho jaaye.",
        tags: ["invalidation"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 1,
        prompt: "Order the steps of a cache-aside read.",
        options: [
          "Receive the request for the menu",
          "Look up the key in Redis",
          "On a miss, query the database",
          "Store the result in Redis with a TTL",
          "Return the response to the client",
        ],
        explanation: "Request → cache check → miss pe DB → cache mein TTL ke saath save → response. Hit hota to step 3–4 skip.",
        tags: ["cache-aside"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "How do you keep cached data from going stale? Explain at least two strategies.",
        keywords: ["ttl", "delete on write", "stale", "version", "invalidation"],
        explanation: "TTL se data apne aap expire hota hai (max staleness fix). Write path pe key delete/update karna (invalidation) turant fresh data deta hai. Key mein version (\`menu:v2:42\`) daal ke format change pe purana cache bekaar kar sakte ho.",
        tags: ["invalidation"],
      },
    ],
    buildTask: {
      title: "Simulate a TTL cache",
      description: `Redis jaisa cache simulate karo. Likho \`simulateCache(ops, ttlMs)\` jo har operation ka result ek list mein return kare.

Har op ek object hai jisme \`at\` (time in ms, badhte order mein) hai:
- \`{ "op": "set", "key": "k", "value": "...", "at": 0 }\` → result \`"OK"\`. Key ki expiry = \`at + ttlMs\`.
- \`{ "op": "get", "key": "k", "at": 50 }\` → value agar key hai aur **\`at < expiry\`**, warna \`null\` (expired key hata do).
- \`{ "op": "del", "key": "k", "at": 60 }\` → \`1\` agar valid (non-expired) key thi aur delete hui, warna \`0\`.

Naya \`set\` purani value aur expiry dono overwrite karta hai.`,
      functionName: "simulateCache",
      starterJs: `function simulateCache(ops, ttlMs) {
  const store = {};
  const results = [];
  // handle set / get / del
  return results;
}
`,
      starterPython: `def simulateCache(ops, ttlMs):
    store = {}
    results = []
    # handle set / get / del
    return results
`,
      tests: [
        {
          name: "set then get",
          args: [[{ op: "set", key: "menu", value: "v1", at: 0 }, { op: "get", key: "menu", at: 10 }], 100],
          expected: ["OK", "v1"],
        },
        {
          name: "expires at ttl",
          args: [[{ op: "set", key: "menu", value: "v1", at: 0 }, { op: "get", key: "menu", at: 99 }, { op: "get", key: "menu", at: 100 }], 100],
          expected: ["OK", "v1", null],
        },
        {
          name: "missing key",
          args: [[{ op: "get", key: "nope", at: 5 }], 100],
          expected: [null],
        },
        {
          name: "delete invalidates",
          args: [[{ op: "set", key: "a", value: "1", at: 0 }, { op: "del", key: "a", at: 5 }, { op: "get", key: "a", at: 6 }, { op: "del", key: "a", at: 7 }], 1000],
          expected: ["OK", 1, null, 0],
        },
        {
          name: "set overwrites and extends expiry",
          args: [[{ op: "set", key: "k", value: "old", at: 0 }, { op: "set", key: "k", value: "new", at: 80 }, { op: "get", key: "k", at: 150 }], 100],
          expected: ["OK", "OK", "new"],
        },
        {
          name: "del on expired key returns 0",
          args: [[{ op: "set", key: "otp", value: "4829", at: 0 }, { op: "del", key: "otp", at: 300 }], 300],
          expected: ["OK", 0],
          hidden: true,
        },
        {
          name: "independent keys",
          args: [[{ op: "set", key: "a", value: "A", at: 0 }, { op: "set", key: "b", value: "B", at: 50 }, { op: "get", key: "a", at: 100 }, { op: "get", key: "b", at: 100 }], 60],
          expected: ["OK", "OK", null, "B"],
          hidden: true,
        },
      ],
      hints: [
        "Har key ke saath do cheezein store karo: value aur expiresAt. Time 'at' se aata hai — real clock nahi chahiye.",
        "Ek helper banao jo check kare key valid hai ya nahi (exists aur at < expiresAt); expired ho to delete karke 'nahi hai' maano. set/get/del teeno isi helper ko use karein.",
        "JS: const alive = (key, at) => { const e = store[key]; if (!e) return false; if (at >= e.expiresAt) { delete store[key]; return false; } return true; }; // get: results.push(alive(o.key, o.at) ? store[o.key].value : null);",
      ],
      explainQuestions: [
        { question: "Why is a fake time value ('at') better than Date.now() for testing cache expiry?", keywords: ["deterministic", "tests", "no waiting", "repeatable"] },
        { question: "What happens to expiry when a key is set again, and why does that matter for invalidation?", keywords: ["overwrite", "new expiry", "fresh", "ttl"] },
        { question: "If this cache stored user profiles, what must the key contain to avoid showing one user's data to another? (security)", keywords: ["user id", "unique key", "data leak", "tenant"] },
      ],
      estMinutes: 25,
    },
    interview: [
      {
        question: "Explain cache-aside vs write-through caching.",
        short: "In cache-aside the application reads from the cache, and on a miss loads from the database and populates the cache; writes go to the database and invalidate the cache key. In write-through, every write goes to the cache and the database together, so the cache is always populated but writes are slower and you may cache data nobody reads.",
        deep: `- **Cache-aside (lazy loading)**: simple, only caches what is read, survives cache outages (fall back to DB). Downside: first read is a miss, and invalidation races can leave stale data briefly.
- **Write-through**: write to cache and DB on every update; reads are almost always hits, but write latency increases and cold data fills memory.
- **Write-behind (write-back)**: write to cache and flush to DB asynchronously — fast writes, risk of data loss.
- **Read-through**: the cache library itself loads on miss.
- Most web backends use cache-aside with TTL plus delete-on-write.`,
        followUps: ["Should you delete or update the cache key on write? Why?", "How do you handle Redis being down?", "What race can cause stale data in cache-aside?"],
        commonMistake: "Updating the cache before the database commit, leaving the cache with data that was rolled back.",
        keywords: ["cache-aside", "miss", "write-through", "invalidate", "ttl"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK", "SDE"],
      },
      {
        question: "What is a cache stampede and how do you prevent it?",
        short: "A cache stampede happens when a hot key expires and many concurrent requests miss at once and all hit the database, potentially overloading it. Prevent it with request coalescing or a lock so only one request rebuilds the value, random jitter on TTLs, and refreshing hot keys before they expire.",
        deep: `- **Single-flight / mutex**: \`SET lock:menu:42 1 NX EX 5\` — the winner rebuilds; others wait briefly or serve the stale value.
- **Stale-while-revalidate**: keep serving the old value while one worker refreshes it in the background.
- **TTL jitter**: \`300 + random(0, 60)\` seconds so many keys do not expire together.
- **Probabilistic early refresh**: refresh slightly before expiry with increasing probability.
- Also protect the DB with connection pool limits and circuit breakers.`,
        followUps: ["How would you implement a distributed lock in Redis safely?", "What is stale-while-revalidate?"],
        commonMistake: "Setting the same TTL for thousands of keys populated at deploy time, so they all expire together.",
        keywords: ["hot key", "expire", "lock", "jitter", "database overload"],
        difficulty: 3,
        roles: ["BACKEND", "SDE"],
      },
    ],
    promptCard: {
      title: "Plan a caching layer for my slow endpoint",
      category: "OPTIMIZATION",
      task: "Decide whether and how to cache an endpoint: key design, TTL, invalidation, stampede protection and failure behaviour.",
      whenToUse: "When an endpoint is slow or the database is overloaded by repeated reads of the same data.",
      template: `You are a senior backend engineer experienced with Redis caching in production.

Endpoint: [ENDPOINT]
What it returns and who can see it (public, per-user, per-tenant): [DATA_AND_VISIBILITY]
Current latency and request rate: [TRAFFIC]
How often the underlying data changes, and which code paths change it: [WRITE_PATHS]
How stale the data is allowed to be: [STALENESS_LIMIT]

1. First tell me if caching is the right fix, or if a query/index fix should come first.
2. Propose the cache key format (include user/tenant ids where data is not public) and a version prefix.
3. Choose a TTL and justify it from the staleness limit.
4. List exactly where to invalidate the key in my write paths.
5. Explain how to prevent cache stampede for hot keys.
6. Describe behaviour when Redis is down.
7. Give the metrics I should track (hit rate, latency, memory).
Keep the code examples in [LANGUAGE].`,
      variables: [
        { key: "ENDPOINT", label: "e.g. GET /restaurants/:id/menu" },
        { key: "DATA_AND_VISIBILITY", label: "What data and whether it is public or user-specific" },
        { key: "TRAFFIC", label: "e.g. p95 400 ms, 2,000 requests/sec at peak" },
        { key: "WRITE_PATHS", label: "How often data changes and which endpoints/jobs change it" },
        { key: "STALENESS_LIMIT", label: "e.g. prices must update within 30 seconds" },
        { key: "LANGUAGE", label: "e.g. Node.js with ioredis, Python with redis-py" },
      ],
      whyItWorks: [
        { part: "Ask if caching is right first", why: "Avoids hiding a missing index behind a cache." },
        { part: "Visibility of data", why: "Forces user/tenant ids into keys, preventing cross-user data leaks." },
        { part: "Explicit write paths", why: "Invalidation bugs come from forgotten write paths; listing them makes the plan complete." },
        { part: "Redis-down behaviour and metrics", why: "Makes the cache an optional, observable layer instead of a new single point of failure." },
      ],
      verifyChecklist: [
        "Keys for non-public data include the user or tenant id",
        "Every write path you listed has an invalidation step",
        "TTL matches the staleness limit",
        "The endpoint still works (slower) with Redis stopped",
        "A hit-rate metric or X-Cache header confirms hits after deploy",
      ],
      sampleOutput: `Caching fits: the menu query is already indexed (p95 40 ms DB time) but runs 2,000/sec on identical data.
Key: menu:v1:{restaurantId} (public data, no user id needed).
TTL: 60s + jitter(0–10s), since prices must update within 60s even if invalidation fails.
Invalidate: DEL in PATCH /dishes/:id, POST /dishes, and the nightly price-sync job.
Stampede: SET lock:menu:{id} NX EX 5; others serve stale copy for up to 5s.
Redis down: log a warning and read from Postgres; circuit breaker after 5 failures.`,
    },
  },
  // ───────────────────────────── 8. Password hashing ─────────────────────────────
  {
    slug: "password-hashing",
    estMinutes: 35,
    difficulty: 2,
    prerequisites: ["sql-basics", "https-basics", "input-validation"],
    objectives: [
      "Explain why passwords are hashed, not encrypted or stored as plain text",
      "Use a slow, salted algorithm (argon2id, bcrypt, scrypt) to hash and verify passwords",
      "Compare hashes in constant time and store algorithm parameters with the hash",
      "Respond correctly to a database leak",
    ],
    technicalDefinition:
      "Password hashing transforms a password into a fixed-length digest using a one-way, deliberately slow and memory-hard key derivation function (such as argon2id, bcrypt, scrypt or PBKDF2) combined with a unique random salt per password, so the server can verify login attempts by recomputing the hash without ever storing or being able to recover the original password.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**Password hashing** matlab user ka password database mein **kabhi seedha save nahi karna**. Uski jagah ek **one-way function** se nikla hua "fingerprint" (hash) save karte hain.

- **One-way**: \`hash("chai@123")\` se hash ban jaata hai, par hash se wapas password nikalna practically impossible.
- **Salt**: har user ke liye ek random string jo password ke saath mila ke hash karte hain, taaki do users ka same password ho to bhi hash alag aaye.
- **Slow by design**: \`argon2id\`, \`bcrypt\`, \`scrypt\` jaan-boojhke slow hain, taaki attacker crore guesses jaldi na try kar sake.

Login pe: user ka typed password + stored salt → wahi hash function → stored hash se match? To login successful. Server ko asli password kabhi yaad rakhne ki zaroorat nahi.`,
          en: `**Password hashing** means you **never store the password itself**. You store a "fingerprint" (hash) produced by a **one-way function**.

- **One-way**: you can compute the hash from the password, but not the password from the hash.
- **Salt**: a random value per user mixed in, so identical passwords give different hashes.
- **Slow by design**: \`argon2id\`, \`bcrypt\` and \`scrypt\` are deliberately slow so attackers cannot try billions of guesses quickly.

At login, hash the typed password with the stored salt and compare with the stored hash. The server never needs the real password.`,
          hi: `**Password hashing** का मतलब है user का password database में **कभी सीधे सेव नहीं करना**। उसकी जगह एक **one-way function** से बना "फ़िंगरप्रिंट" (hash) सेव करते हैं।

- **One-way**: password से hash बन जाता है, पर hash से वापस password निकालना व्यावहारिक रूप से असंभव है।
- **Salt**: हर user के लिए एक यादृच्छिक मान जो password के साथ मिलाया जाता है, ताकि एक जैसे password का hash भी अलग आए।
- **जानबूझकर धीमा**: \`argon2id\`, \`bcrypt\`, \`scrypt\` धीमे हैं ताकि हमलावर करोड़ों अनुमान जल्दी न आज़मा सके।

Login पर: लिखा गया password + सहेजा गया salt → वही hash → मिलान हुआ तो login सफल।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Aata chakki** socho. Tum gehun dete ho, chakki aata bana deti hai. Aata dekh ke koi bata sakta hai "haan, ye isi gehun se bana hai" — same gehun dobara pisao to same aata. Par **aate se wapas gehun nahi bana sakte**. Yahi hashing hai: password = gehun, hash = aata.

**Salt** = har customer ke gehun mein ek alag secret masala mila dena. Ab Sharma ji aur Verma ji dono ka gehun same ho, to bhi dono ka aata alag dikhega. Chor ke paas "common gehun → aata" ki ready-made list (rainbow table) ho, to bhi kaam nahi aayegi.

**Slow hashing** = chakki jaan-boojhke dheere chalti hai. Tumhare liye ek kilo pisna 1 second — koi farak nahi. Par chor ko crore alag gehun try karne hain — use saalon lag jaayenge.`,
          en: `Think of a **flour mill**. You give wheat, it gives flour. Grinding the same wheat again gives the same flour, so you can check "yes, this flour came from that wheat". But **you cannot turn flour back into wheat**. Password is wheat, hash is flour.

A **salt** is a different secret spice mixed into each customer's wheat, so two identical batches produce different flour, and a thief's ready-made "wheat to flour" list (a rainbow table) becomes useless.

**Slow hashing** is a mill that grinds slowly on purpose: one second for you is nothing, but a thief trying millions of batches needs years.`,
          hi: `**आटा चक्की** सोचिए। आप गेहूँ देते हैं, चक्की आटा बना देती है। वही गेहूँ दोबारा पीसो तो वही आटा — इसलिए जाँच सकते हैं कि आटा उसी गेहूँ से बना है। पर **आटे से वापस गेहूँ नहीं बना सकते**। Password = गेहूँ, hash = आटा।

**Salt** = हर ग्राहक के गेहूँ में एक अलग गुप्त मसाला। अब दो लोगों का गेहूँ एक जैसा हो तब भी आटा अलग दिखेगा, और चोर की तैयार सूची (rainbow table) बेकार।

**धीमी hashing** = चक्की जानबूझकर धीरे चलती है। आपके लिए एक सेकंड कुछ नहीं, पर करोड़ों अनुमान आज़माने वाले चोर को सालों लगेंगे।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `Database leak hona "agar" ka sawaal nahi, "kab" ka hai — SQL injection, galat configured backup, chori hua laptop, ya andar ka koi banda. Aur log ek hi password har jagah use karte hain — college portal, Gmail, UPI app.

- **Plain text** store kiya → leak hote hi sab users ke asli password attacker ke paas. Wo inhe Gmail, bank pe try karega (**credential stuffing**).
- **Encryption** kiya → key bhi kahin server pe hai; key leak = sab password decrypt.
- **Fast hash (MD5/SHA-256) bina salt** → GPU har second **arabon** SHA-256 guesses try kar sakta hai, aur common passwords ke ready-made tables pehle se maujood hain.
- **Slow + salted hash (argon2id/bcrypt)** → har guess mehenga, har user ke liye alag attack. Strong passwords practically safe rehte hain.

Isliye OWASP Password Storage Cheat Sheet argon2id (ya bcrypt/scrypt) recommend karta hai. Ye backend developer ki basic zimmedaari hai.`,
          en: `Database leaks happen through SQL injection, exposed backups, stolen laptops or insiders. And people reuse passwords everywhere.

- **Plain text**: a leak hands attackers every real password for **credential stuffing** on other sites.
- **Encryption**: the key lives on a server too; leak the key and everything decrypts.
- **Fast unsalted hashes** like MD5 or SHA-256: GPUs try billions of guesses per second and precomputed tables exist.
- **Slow salted hashes** like argon2id or bcrypt make every guess expensive and per-user.

That is why the OWASP Password Storage Cheat Sheet recommends argon2id, bcrypt or scrypt.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Kahan dikhta hai:

- **Django**: default mein PBKDF2 (salt + bahut saari iterations) se password store karta hai, aur argon2/bcrypt ka option deta hai. Stored value mein algorithm aur iterations bhi likhe hote hain, jaise \`pbkdf2_sha256$...$salt$hash\`.
- **Node apps**: \`bcrypt\` / \`argon2\` npm packages bahut common hain — \`await bcrypt.hash(password, 12)\` aur \`await bcrypt.compare(input, hash)\`.
- **Auth providers (Auth0, Firebase Auth, Supabase Auth)**: ye apne aap salted slow hashing karte hain — isliye bahut startups khud password store hi nahi karte.
- **Leak ke baad**: kai badi companies ke breach reports mein ye farak saaf dikha hai — jahan passwords sirf unsalted fast hash (jaise SHA-1) mein the, unke crack hone ki khabrein aayi; isliye industry slow hashes pe shift hui.`,
          en: `Where it shows up:

- **Django** stores passwords with salted PBKDF2 by default (argon2 and bcrypt optional), and the stored string records the algorithm and iterations, like \`pbkdf2_sha256$...$salt$hash\`.
- **Node apps** use the \`bcrypt\` or \`argon2\` packages: \`bcrypt.hash(password, 12)\` and \`bcrypt.compare(input, hash)\`.
- **Auth providers** like Auth0, Firebase Auth and Supabase Auth handle hashing for you.
- Public breach write-ups show that leaked unsalted fast hashes get cracked at scale, which pushed the industry to slow hashes.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `**Signup pe**:
1. Random **salt** banao (16 bytes, \`crypto.randomBytes\`).
2. \`hash = KDF(password, salt, params)\` — KDF jaise scrypt jo bahut memory aur CPU leta hai.
3. DB mein ek string save karo jisme **algorithm + params + salt + hash** sab ho, jaise \`scrypt$16384$8$1$<salt>$<hash>\`. bcrypt ka format \`$2b$12$<salt+hash>\` hai — cost 12 bhi string mein hi hai.

**Login pe**:
1. Email se user dhundho, stored string parse karo.
2. Typed password ko **same salt aur params** se hash karo.
3. Dono hash ko **constant-time** compare karo (\`crypto.timingSafeEqual\`, \`hmac.compare_digest\`), taaki response time se attacker kuch andaza na lagaye.

**Params** (cost/iterations/memory) store karne ka fayda: hardware fast hone pe cost badha sakte ho. Agli successful login pe purana hash naye cost se **rehash** karke save kar do.`,
          en: `**On signup**:
1. Generate a random 16-byte **salt**.
2. Compute \`KDF(password, salt, params)\` with a CPU- and memory-hard function like scrypt.
3. Store **algorithm, params, salt and hash** together, e.g. \`scrypt$16384$8$1$<salt>$<hash>\`; bcrypt strings like \`$2b$12$...\` embed the cost too.

**On login**: look up the user, parse the stored string, hash the typed password with the **same salt and params**, and compare in **constant time** (\`timingSafeEqual\`, \`compare_digest\`).

Storing params lets you raise the cost later and **rehash** on the next successful login.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Dono versions sirf standard library use karte hain — Node mein \`node:crypto\` ka \`scryptSync\`, Python mein \`hashlib.scrypt\`:

- \`hashPassword(pw)\`: 16-byte random salt, scrypt se 32-byte key, aur ek string \`scrypt$N$r$p$salt$hash\` return.
- \`verifyPassword(pw, stored)\`: string ko \`$\` pe split karke params aur salt nikaalo, typed password ko **same params** se hash karo, aur **constant-time compare** (\`timingSafeEqual\` / \`hmac.compare_digest\`).
- Same password do baar hash kiya — salt alag hai isliye **hash alag** aaye, par dono verify ho jaate hain.
- Galat password \`false\` deta hai.

Salt random hai, isliye hum hash print nahi kar rahe (har run alag hoga) — sirf booleans aur format print karte hain. Production mein \`bcrypt\`/\`argon2\` library bhi yahi andar karti hai.`,
          en: `Both versions use only the standard library: Node's \`scryptSync\` and Python's \`hashlib.scrypt\`.

- \`hashPassword\` creates a 16-byte random salt, derives a 32-byte key and returns \`scrypt$N$r$p$salt$hash\`.
- \`verifyPassword\` splits the string, re-hashes the typed password with the **same params and salt**, and compares in **constant time**.
- Hashing the same password twice gives **different hashes** (different salts), yet both verify.
- A wrong password returns \`false\`.

Because salts are random, only booleans and the format are printed. Libraries like bcrypt and argon2 do the same internally.`,
        },
        codeJs: `const crypto = require("node:crypto");

// demo cost kept small so this runs fast; tune N higher (e.g. 2 ** 15+) in production
const N = 8192, r = 8, p = 1, KEYLEN = 32;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N, r, p });
  return ["scrypt", N, r, p, salt.toString("hex"), hash.toString("hex")].join("$");
}

function verifyPassword(password, stored) {
  const [algo, n, rr, pp, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt") return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length, {
    N: Number(n), r: Number(rr), p: Number(pp),
  });
  return crypto.timingSafeEqual(actual, expected);
}

const h1 = hashPassword("chai@1234");
const h2 = hashPassword("chai@1234");
console.log("format:", h1.split("$").slice(0, 4).join("$") + "$<salt>$<hash>");
console.log("same password, different stored hashes:", h1 !== h2);
console.log("correct password (h1):", verifyPassword("chai@1234", h1));
console.log("correct password (h2):", verifyPassword("chai@1234", h2));
console.log("wrong password:", verifyPassword("chai@12345", h1));
`,
        codePython: `import hashlib
import hmac
import os

# demo cost kept small so this runs fast; tune N higher (e.g. 2 ** 15+) in production
N, R, P, KEYLEN = 8192, 8, 1, 32


def hash_password(password):
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=N, r=R, p=P, dklen=KEYLEN)
    return "$".join(["scrypt", str(N), str(R), str(P), salt.hex(), digest.hex()])


def verify_password(password, stored):
    algo, n, r, p, salt_hex, hash_hex = stored.split("$")
    if algo != "scrypt":
        return False
    expected = bytes.fromhex(hash_hex)
    actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex),
                            n=int(n), r=int(r), p=int(p), dklen=len(expected))
    return hmac.compare_digest(actual, expected)


h1 = hash_password("chai@1234")
h2 = hash_password("chai@1234")
print("format:", "$".join(h1.split("$")[:4]) + "$<salt>$<hash>")
print("same password, different stored hashes:", h1 != h2)
print("correct password (h1):", verify_password("chai@1234", h1))
print("correct password (h2):", verify_password("chai@1234", h2))
print("wrong password:", verify_password("chai@12345", h1))
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `Password storage ki galtiyan jo aaj bhi hoti hain:

- **Plain text save karna** — "baad mein theek kar denge". Kabhi mat karo.
- **MD5/SHA-1/SHA-256 use karna**: ye fast hash hain, file checksums ke liye bane hain, passwords ke liye nahi.
- **Ek hi global salt** sab users ke liye: same passwords ka same hash → pattern dikh jaata hai. Salt **per user random** hona chahiye.
- **Encryption ko hashing samajhna**: "admin ko password dikhna chahiye" — nahi! Forgot password ka flow **reset link** hota hai, password wapas bhejna nahi.
- **\`===\` se hash compare**: timing attack ka chhota risk. Constant-time compare use karo.
- **Bahut kam cost** (bcrypt cost 4) ya itna zyada ki login 5 second le. Server pe ~100–300 ms target karo.
- **Password logs mein aana**: request body log karte waqt \`password\` field bhi log ho gaya! Logger mein redact karo.
- **Max length na rakhna**: 1 MB password bhej ke CPU DoS. bcrypt waise bhi 72 bytes tak hi dekhta hai.`,
          en: `Mistakes still seen today:

- **Storing plain text**.
- **Using MD5, SHA-1 or SHA-256**, which are fast checksums, not password hashes.
- **One global salt** for everyone instead of a random per-user salt.
- **Encrypting so admins can read passwords**; "forgot password" should send a reset link.
- **Comparing with \`===\`** instead of constant-time comparison.
- **Wrong cost**: too low is weak, too high makes login slow; aim for roughly 100–300 ms.
- **Logging request bodies** that contain passwords.
- **No max length**, allowing CPU-exhaustion attacks.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `Login/hash se jude bugs:

1. **"Sahi password pe bhi login fail"**: check karo signup aur login dono same normalisation karte hain? Ek jagah \`trim()\` kiya, doosri jagah nahi → hash alag. (Passwords ko generally trim mat karo.)
2. **Hash compare hamesha false**: stored string truncate to nahi ho rahi? Column \`VARCHAR(50)\` hai aur bcrypt hash 60 characters ka → kat gaya! \`TEXT\` ya kaafi lamba column rakho.
3. **Encoding**: hex vs base64 mix — save base64 mein, read hex mein. Ek format fix karo.
4. **Login bahut slow**: cost/params check karo, aur ye dekho ki hashing main thread block to nahi kar rahi (Node mein \`scryptSync\` event loop rokta hai; server code mein async \`scrypt\`/library ka async API use karo).
5. **Logs check karo** ki kahin password plain text mein to nahi dikh raha: \`grep -i password app.log\`.

Unit test likho: hash → verify true, wrong password → false, do hash alag.`,
          en: `Debugging hashing:

1. **Correct password fails**: signup and login must normalise identically; one \`trim()\` changes the hash.
2. **Always false**: is the stored hash truncated by a short column? bcrypt hashes are 60 characters.
3. **Encoding mismatch** between hex and base64.
4. **Slow logins**: check the cost, and avoid blocking Node's event loop with \`scryptSync\` in servers; use async APIs.
5. **Search logs** for leaked passwords.

Unit-test that hashes verify, wrong passwords fail and two hashes differ.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Choices aur unke tradeoffs:

- **argon2id**: modern recommendation, memory-hard (GPU attacks mehenge). Library har platform pe install karni padti hai.
- **bcrypt**: purana, bahut tested, har language mein available. Limitation: password ke sirf pehle 72 bytes use hote hain.
- **scrypt**: memory-hard, Node aur Python stdlib mein available.
- **PBKDF2**: FIPS compliance chahiye to; memory-hard nahi, isliye iterations bahut zyada (lakhon) rakhni padti hain.

**Cost vs UX**: zyada cost = zyada safe, par har login pe zyada CPU. Login endpoint pe **rate limiting** zaroori, warna attacker tumhare server ka CPU khud jala dega.

**Kya passwords hi chahiye?** Alternatives: **OTP login**, **magic links**, **passkeys (WebAuthn)**, ya "Login with Google" (OAuth). Inme tumhe password store hi nahi karna padta — risk hi khatam. Bahut apps password + OTP (2FA) dono rakhti hain.`,
          en: `Choices and trade-offs:

- **argon2id**: the modern recommendation, memory-hard; needs a native library.
- **bcrypt**: battle-tested and everywhere, but only uses the first 72 bytes.
- **scrypt**: memory-hard and in Node and Python standard libraries.
- **PBKDF2**: for FIPS compliance; not memory-hard, so it needs very high iteration counts.

Higher cost is safer but uses more CPU per login, so **rate-limit** login endpoints. Alternatives that avoid storing passwords: OTP, magic links, **passkeys**, or OAuth login. Many apps add 2FA on top.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real Node project mein password flow:

\`\`\`js
// signup
const hash = await argon2.hash(password, { type: argon2.argon2id });
await db.user.create({ data: { email, passwordHash: hash } });

// login
const user = await db.user.findUnique({ where: { email } });
const ok = user && (await argon2.verify(user.passwordHash, password));
if (!ok) return res.status(401).json({ error: "Invalid email or password" });
if (argon2.needsRehash(user.passwordHash)) { /* hash again with new params and save */ }
\`\`\`

Dhyaan do:
- Error message **same** hai chahe email galat ho ya password — taaki attacker ye na jaan sake ki email registered hai (user enumeration).
- Column ka naam \`passwordHash\` — aur API responses mein ye field **kabhi** nahi jaata (select mein exclude).
- Login route pe rate limit + logs mein password redact.
- Forgot password: random single-use token (hash karke store), 15 minute expiry.`,
          en: `In a real Node project, signup stores \`argon2.hash(password, { type: argon2id })\` in a \`passwordHash\` column; login finds the user by email, runs \`argon2.verify\`, and returns the **same** "Invalid email or password" message whether the email or password is wrong, preventing user enumeration. If \`needsRehash\` is true, the password is rehashed with new params.

\`passwordHash\` is never selected into API responses, the login route is rate-limited, logs redact passwords, and password resets use single-use, hashed, short-lived tokens.`,
        },
      },
    ],
    visualization: {
      kind: "FLOW",
      title: "Signup and login with a salted hash",
      steps: [
        { title: "Signup: generate salt", description: "Server creates a random 16-byte salt just for this user.", highlight: "random salt" },
        { title: "Signup: slow hash", description: "scrypt/argon2id(password, salt, params) takes ~100 ms and produces the hash.", highlight: "KDF" },
        { title: "Signup: store, never the password", description: "DB saves 'algo$params$salt$hash'. The plain password is discarded.", highlight: "passwordHash" },
        { title: "Login: recompute", description: "Typed password + stored salt + stored params → new hash.", highlight: "same salt" },
        { title: "Login: constant-time compare", description: "If the hashes match, issue a session or token; if not, return 401 with a generic message.", highlight: "timingSafeEqual" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is the main purpose of a salt in password hashing?",
        options: [
          "To make the password easier to remember",
          "To make identical passwords produce different hashes and defeat precomputed (rainbow) tables",
          "To encrypt the hash so admins can read it",
          "To make hashing faster",
        ],
        correct: [1],
        explanation: "Har user ka random salt → same password ka bhi alag hash. Attacker ki ready-made tables bekaar, aur use har user pe alag se mehnat karni padti hai.",
        tags: ["salt"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Which algorithm is appropriate for storing user passwords?",
        options: ["MD5", "SHA-256 without salt", "argon2id", "Base64 encoding"],
        correct: [2],
        explanation: "**argon2id** (ya bcrypt/scrypt) slow aur salted hai — passwords ke liye bana hai. MD5/SHA-256 bahut fast hain, aur Base64 to encoding hai, koi suraksha nahi.",
        tags: ["algorithms"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Why is hashing preferred over encryption for storing passwords?",
        options: [
          "Hashing is reversible with a key",
          "The server only needs to verify passwords, and a one-way hash leaves nothing to decrypt if the database and keys leak",
          "Encryption is not supported by databases",
          "Hashes are shorter so they save money",
        ],
        correct: [1],
        explanation: "Server ko password **wapas padhne** ki zaroorat hi nahi, sirf match karna hai. Encryption mein key leak = sab password khul gaye. Hash one-way hai.",
        tags: ["hashing-vs-encryption"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which are good password storage practices? (Select all that apply)",
        options: [
          "A unique random salt per user",
          "A deliberately slow algorithm like bcrypt or argon2id",
          "Encrypting passwords so support staff can tell users their password",
          "Comparing hashes with a constant-time function",
        ],
        correct: [0, 1, 3],
        explanation: "Per-user salt, slow algorithm aur constant-time compare — teeno sahi. Support staff ko password dikhana galat hai; forgot password = **reset link**.",
        tags: ["best-practices"],
      },
      {
        type: "SPOT_BUG",
        difficulty: 2,
        prompt: "What is wrong with how this signup function stores the password?",
        code: `import hashlib

def save_user(db, email, password):
    hashed = hashlib.sha256(password.encode()).hexdigest()
    db.insert("users", {"email": email, "password": hashed})`,
        codeLanguage: "python",
        options: [
          "Nothing, SHA-256 is secure for passwords",
          "It uses a fast, unsalted hash; identical passwords match and GPUs can brute-force it — use argon2id/bcrypt/scrypt with a per-user salt",
          "It should use MD5 instead because it is faster",
          "The email should be hashed instead of the password",
        ],
        correct: [1],
        explanation: "SHA-256 fast hai (GPU pe arabon guesses/second) aur yahan **salt bhi nahi** — same password = same hash, rainbow tables kaam karengi. Slow salted KDF use karo, aur column ka naam \`password_hash\` rakho.",
        tags: ["security"],
      },
      {
        type: "SCENARIO",
        difficulty: 3,
        prompt: "Your users table (with bcrypt hashes, cost 12) was leaked through a misconfigured backup. What should the team do?",
        options: [
          "Nothing — bcrypt means there is no risk at all",
          "Fix the leak, rotate secrets, invalidate active sessions, notify users, require or strongly prompt password resets, and watch for credential-stuffing attempts",
          "Switch to MD5 so hashes are smaller",
          "Delete all user accounts",
        ],
        correct: [1],
        explanation: "bcrypt time khareedta hai, guarantee nahi — weak passwords (\`123456\`) phir bhi crack ho sakte hain. Isliye leak band karo, sessions/secrets rotate, users ko batao, reset karwao aur suspicious logins monitor karo.",
        tags: ["incident-response"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps of verifying a password at login.",
        options: [
          "Find the user by email",
          "Read the stored algorithm, params, salt and hash",
          "Hash the typed password with the same salt and params",
          "Compare the two hashes in constant time",
          "On match, create a session or token; otherwise return a generic 401",
        ],
        explanation: "User dhundho → stored string parse → same salt/params se naya hash → constant-time compare → result ke hisaab se session ya 401 (generic message).",
        tags: ["login-flow"],
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Why should a password hashing function be deliberately slow?",
        keywords: ["brute force", "attacker", "guesses per second", "cost factor", "gpu"],
        explanation: "Normal user ke liye 100 ms ka farak nahi padta, par leak hue hashes pe brute force karne wale attacker ke guesses per second bahut kam ho jaate hain. Cost factor badha ke ise future mein aur slow kar sakte hain, GPU attacks bhi mehenge.",
        tags: ["cost"],
      },
    ],
    interview: [
      {
        question: "How would you store user passwords securely?",
        short: "I would never store the password itself. I would hash it with a slow, salted, memory-hard algorithm like argon2id (or bcrypt/scrypt), with a unique random salt per user, store the algorithm and parameters with the hash, verify with constant-time comparison, rate-limit login, and rehash when I increase the cost.",
        deep: `- Use a vetted library: \`argon2\`, \`bcrypt\`, or stdlib \`scrypt\`.
- Tune cost so a hash takes ~100–300 ms on production hardware.
- Store a self-describing string (\`$argon2id$v=19$m=65536,t=3,p=4$salt$hash\`).
- Optional **pepper**: a secret key (stored outside the DB, e.g. in a secrets manager) mixed in, so a DB-only leak is not enough.
- Never log passwords; enforce a reasonable max length; return the same error for unknown email and wrong password.
- On breach: rotate, invalidate sessions, force resets.`,
        followUps: ["What is a pepper and where do you keep it?", "How do you migrate users from SHA-1 hashes to argon2?", "How do you choose the cost factor?"],
        commonMistake: "Answering 'I use SHA-256' or 'I encrypt passwords with AES'.",
        keywords: ["argon2id", "salt", "slow", "constant-time", "rehash"],
        difficulty: 1,
        roles: ["BACKEND", "FULLSTACK"],
      },
      {
        question: "What is the difference between hashing, encryption and encoding?",
        short: "Encoding (like Base64) changes representation and is reversible by anyone — no security. Encryption is reversible with a key and protects confidentiality, used for data you must read back. Hashing is one-way and is used for integrity checks and, with slow salted algorithms, for password storage.",
        deep: `- **Encoding**: Base64, URL encoding — for transport; never security.
- **Encryption**: AES-GCM (symmetric), RSA/ECC (asymmetric). Used for stored secrets you need again (API tokens for third parties), TLS in transit.
- **Hashing**: SHA-256 for checksums/HMAC; argon2/bcrypt/scrypt for passwords.
- A JWT payload is Base64url-encoded, not encrypted — anyone can read it.`,
        followUps: ["Is a JWT encrypted?", "Why not use SHA-256 for passwords if it is one-way?"],
        commonMistake: "Calling Base64 'encryption'.",
        keywords: ["reversible", "key", "one-way", "base64"],
        difficulty: 1,
        roles: ["BACKEND", "FULLSTACK", "SDE"],
      },
    ],
  },
  // ───────────────────────────── 9. JWT authentication ─────────────────────────────
  {
    slug: "jwt-authentication",
    estMinutes: 50,
    difficulty: 3,
    prerequisites: ["password-hashing", "http-headers-cookies", "sessions-vs-jwt", "express-middleware"],
    objectives: [
      "Explain the three parts of a JWT and why the payload is readable but tamper-proof",
      "Sign and verify HS256 tokens, checking algorithm, signature and expiry",
      "Design access and refresh tokens with short expiry and revocation",
      "Choose where to store tokens on the client and defend against XSS/CSRF",
    ],
    technicalDefinition:
      "A JSON Web Token (JWT, RFC 7519) is a compact, URL-safe string of three Base64url-encoded parts — header, payload (claims such as sub, exp, iat) and signature — where the signature (e.g. HMAC-SHA256 with a shared secret, or RS256/ES256 with a private key) lets a server verify that the claims were issued by a trusted party and not modified, enabling stateless authentication without a server-side session lookup.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**JWT (JSON Web Token)** ek signed "pass" hai jo login ke baad server user ko deta hai. Har agli request mein client ise bhejta hai (\`Authorization: Bearer <token>\`) aur server bina DB dekhe pehchaan leta hai ki ye kaun hai.

JWT ke **teen hisse** hote hain, dots se jude: \`header.payload.signature\`
- **Header**: kaunsa algorithm — \`{"alg":"HS256","typ":"JWT"}\`
- **Payload (claims)**: \`{"sub":"42","role":"user","exp":1700000900}\` — user kaun hai, token kab expire hoga.
- **Signature**: header + payload ka HMAC, server ke **secret** se.

Sabse important baat: payload **encrypted nahi hai**, sirf Base64url encoded hai — koi bhi padh sakta hai. Par koi badal nahi sakta, kyunki badalte hi signature match nahi karega.`,
          en: `A **JWT (JSON Web Token)** is a signed "pass" the server gives after login. The client sends it with every request (\`Authorization: Bearer <token>\`) and the server identifies the user without a database lookup.

It has **three parts** joined by dots: \`header.payload.signature\`
- **Header**: the algorithm, e.g. \`{"alg":"HS256","typ":"JWT"}\`.
- **Payload (claims)**: who the user is and when the token expires.
- **Signature**: an HMAC of header and payload using the server's **secret**.

Key point: the payload is **not encrypted**, only Base64url-encoded, so anyone can read it. But nobody can change it without breaking the signature.`,
          hi: `**JWT (JSON Web Token)** एक हस्ताक्षरित "पास" है जो login के बाद सर्वर user को देता है। हर अगली request में client इसे भेजता है (\`Authorization: Bearer <token>\`) और सर्वर बिना database देखे पहचान लेता है कि यह कौन है।

JWT के **तीन हिस्से** होते हैं, बिंदुओं से जुड़े: \`header.payload.signature\`
- **Header**: कौन सा algorithm।
- **Payload (claims)**: user कौन है, token कब समाप्त होगा।
- **Signature**: सर्वर के **secret** से बना हस्ताक्षर।

सबसे ज़रूरी बात: payload **एन्क्रिप्टेड नहीं** है, सिर्फ़ Base64url में लिखा है — कोई भी पढ़ सकता है। पर कोई बदल नहीं सकता, क्योंकि बदलते ही हस्ताक्षर मेल नहीं खाएगा।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Concert ka wristband** socho. Gate pe ID aur ticket check karke (login + password) tumhe ek wristband pehna diya jaata hai jispe likha hai: "VIP, Day 1" aur ek **special hologram seal** laga hai.

Ab andar har stall ya VIP lounge pe koi tumhara ticket ya ID dobara nahi maangta — bas wristband dekh ke hologram check karta hai. Ye **JWT** hai: payload = wristband pe likha text, signature = hologram.

- Wristband pe likha text **sab padh sakte hain** — isliye uspe apna PIN mat likhwao (payload mein secrets nahi).
- Tum pen se "VIP" ko "ALL ACCESS" kar do — hologram match nahi karega, guard pakad lega (**tampering fail**).
- Wristband pe "Day 1" likha hai — Day 2 pe bekaar (**exp**).

Problem: agar wristband kho gaya ya chori ho gaya, to jab tak expire na ho, koi bhi use kar sakta hai. Isliye **short expiry** rakhte hain.`,
          en: `Think of a **concert wristband**. At the gate your ID and ticket are checked (login), and you get a wristband saying "VIP, Day 1" with a **hologram seal**.

Inside, stalls and lounges do not check your ID again; they just check the hologram. That is a **JWT**: the printed text is the payload, the hologram is the signature.

- Anyone can read the wristband, so never write secrets on it.
- Change "VIP" to "ALL ACCESS" with a pen and the hologram no longer matches (**tampering fails**).
- "Day 1" means it is useless on Day 2 (**exp**).

If it is stolen, anyone can use it until it expires, which is why expiry is kept **short**.`,
          hi: `**कॉन्सर्ट का रिस्टबैंड** सोचिए। गेट पर पहचान और टिकट जाँचकर (login) आपको एक रिस्टबैंड पहनाया जाता है जिस पर लिखा है "VIP, दिन 1" और एक **होलोग्राम मुहर** लगी है।

अंदर हर स्टॉल पर कोई पहचान दोबारा नहीं माँगता — बस होलोग्राम देखता है। यही **JWT** है: लिखा हुआ text = payload, होलोग्राम = signature।

- रिस्टबैंड पर लिखा सब पढ़ सकते हैं — इसलिए उस पर कोई गुप्त बात नहीं।
- पेन से "VIP" को बदल दो — होलोग्राम मेल नहीं खाएगा (**छेड़छाड़ पकड़ी गई**)।
- "दिन 1" — दिन 2 पर बेकार (**exp**)।

चोरी हो जाए तो समाप्त होने तक कोई भी इस्तेमाल कर सकता है, इसलिए समय सीमा **छोटी** रखते हैं।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `HTTP **stateless** hai — har request alag hai, server ko yaad nahi ki pichli request kisne bheji. To login ke baad "ye wahi user hai" kaise pata chale?

**Option 1 — Session**: server ek random session id banata hai, DB/Redis mein \`sessionId → userId\` store karta hai, cookie mein id bhejta hai. Har request pe lookup.

**Option 2 — JWT**: server user ki info khud token mein daal ke **sign** kar deta hai. Har request pe sirf signature verify — **koi DB/Redis lookup nahi**.

JWT kyun useful:
- **Multiple services / microservices**: order-service, payment-service sab ek hi public key se token verify kar sakte hain, central session store ke bina.
- **Mobile apps aur third-party APIs**: \`Authorization\` header mein token bhejna simple hai.
- **Scale**: har request pe session lookup ka load nahi.

Par tradeoff hai — token issue hone ke baad usse "wapas lena" (revoke) mushkil hai. Isliye design dhyan se karna padta hai.`,
          en: `HTTP is **stateless**, so after login the server needs a way to recognise the user on each request.

**Sessions**: the server stores \`sessionId → userId\` in a DB or Redis and sends the id in a cookie; every request needs a lookup.

**JWT**: the server puts the user's identity in a token and **signs** it; every request only needs signature verification, **no lookup**.

JWTs help when **many services** verify the same token (e.g. with a shared public key), for **mobile apps and APIs** using an \`Authorization\` header, and at **scale**. The trade-off: revoking an issued token is hard.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `JWT kahan dikhte hain:

- **OAuth 2.0 / OpenID Connect providers** (Google Sign-In, Auth0, AWS Cognito): login ke baad **ID token** JWT format mein milta hai. Tumhara backend Google ki public keys (JWKS) se signature verify karta hai.
- **Firebase Authentication**: client ko ID token (JWT) milta hai; backend Admin SDK se \`verifyIdToken\` karta hai.
- **Supabase**: user ka access token JWT hai, aur Postgres row-level security policies us token ke claims (jaise \`auth.uid()\`) use karti hain.
- **Microservices**: API gateway token verify karke andar ki services ko user info forward karta hai.

Common pattern: **chhota access token** (5–15 minute) + **lamba refresh token** (din/hafte) jo server-side revoke ho sakta hai.`,
          en: `Where JWTs appear:

- **OAuth 2.0 / OpenID Connect providers** (Google Sign-In, Auth0, AWS Cognito) issue **ID tokens** as JWTs, verified with the provider's public keys (JWKS).
- **Firebase Authentication** gives clients an ID token that backends check with \`verifyIdToken\`.
- **Supabase** access tokens are JWTs, and Postgres row-level security policies read their claims.
- **Microservices**: an API gateway verifies the token and forwards user info.

The common pattern is a **short access token** (5–15 minutes) plus a **longer refresh token** that can be revoked.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `**Sign karna (HS256)**:
1. \`header = base64url(JSON {"alg":"HS256","typ":"JWT"})\`
2. \`payload = base64url(JSON {"sub":"42","exp":...})\`
3. \`signature = base64url(HMAC_SHA256(secret, header + "." + payload))\`
4. Token = \`header.payload.signature\`

**Verify karna**:
1. Token ko 3 hisson mein todo; 3 nahi hain to reject.
2. Header ka \`alg\` **wahi hona chahiye jo server expect karta hai** (\`HS256\`). \`"alg":"none"\` ya unexpected alg → reject. Libraries mein \`algorithms: ["HS256"]\` pin karo.
3. Server apne secret se header + payload ka HMAC dobara banata hai aur token ke signature se **constant-time** compare karta hai.
4. Claims check: \`exp\` (expired?), \`nbf\`, \`iss\` (kisne issue kiya), \`aud\` (kiske liye).
5. Sab theek → \`req.user = { id: payload.sub, role: payload.role }\`.

**RS256/ES256** mein private key se sign hota hai aur **public key** se verify — isliye doosri services ko secret dene ki zaroorat nahi.`,
          en: `**Signing (HS256)**: base64url-encode the header and payload, compute \`HMAC_SHA256(secret, header + "." + payload)\`, base64url it, and join the three with dots.

**Verifying**:
1. Split into exactly three parts.
2. Require the expected \`alg\` (e.g. \`HS256\`); reject \`none\` or anything unexpected by pinning \`algorithms: ["HS256"]\`.
3. Recompute the HMAC and compare in **constant time**.
4. Check claims: \`exp\`, \`nbf\`, \`iss\`, \`aud\`.
5. Set \`req.user\` from the claims.

With **RS256/ES256**, a private key signs and a **public key** verifies, so other services never need the secret.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yahan JWT **bina library ke** banaya hai taaki andar ka jaadu dikhe (production mein \`jsonwebtoken\`/\`jose\`/\`PyJWT\` use karo):

- \`sign(payload)\`: header aur payload ko JSON → base64url, phir \`HMAC-SHA256\` with \`SECRET\`.
- \`verify(token, now)\`: 3 parts check, **alg pin** (\`HS256\` ke alawa sab reject), signature dobara banake **timingSafeEqual** / \`compare_digest\`, phir \`exp\` check.
- \`now\` ek fixed number hai (fake clock), isliye output har baar same — aur JS aur Python dono **same token** banate hain!

Chaar cases chalaye:
1. Sahi token → ok.
2. Payload mein \`role\` ko \`admin\` kar diya, purana signature rakha → **bad signature**.
3. Expiry ke baad → **expired**.
4. \`alg: none\` wala token (bina signature) → **reject**.

Output dhyaan se dekho — token ka beech wala hissa koi bhi decode kar sakta hai.`,
          en: `This builds JWTs **without a library** to show the internals (use \`jsonwebtoken\`, \`jose\` or \`PyJWT\` in production):

- \`sign\` base64url-encodes header and payload and adds an \`HMAC-SHA256\` signature.
- \`verify\` checks three parts, **pins the algorithm**, recomputes and compares the signature in constant time, then checks \`exp\`.
- \`now\` is a fixed fake clock, so the output is deterministic and JS and Python produce the **same token**.

Four cases: a valid token, a tampered \`role\`, an expired token and an \`alg: none\` token. Only the first passes.`,
        },
        codeJs: `const crypto = require("node:crypto");

const SECRET = "prompters-demo-secret"; // real apps: long random value from an env variable
const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const decode = (part) => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

function sign(payload) {
  const header = b64url({ alg: "HS256", typ: "JWT" });
  const body = b64url(payload);
  const sig = crypto.createHmac("sha256", SECRET).update(header + "." + body).digest("base64url");
  return header + "." + body + "." + sig;
}

function verify(token, now) {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [h, b, s] = parts;
  const header = decode(h);
  if (header.alg !== "HS256") return { ok: false, reason: "unexpected alg " + header.alg };
  const expected = crypto.createHmac("sha256", SECRET).update(h + "." + b).digest();
  const given = Buffer.from(s, "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return { ok: false, reason: "bad signature" };
  }
  const payload = decode(b);
  if (payload.exp <= now) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}

const now = 1700000000;
const token = sign({ sub: "42", role: "user", iat: now, exp: now + 900 });
console.log("token:", token);
console.log("1 valid:   ", JSON.stringify(verify(token, now + 60)));

const [h, , s] = token.split(".");
const forgedBody = b64url({ sub: "42", role: "admin", iat: now, exp: now + 900 });
console.log("2 tampered:", JSON.stringify(verify(h + "." + forgedBody + "." + s, now + 60)));
console.log("3 expired: ", JSON.stringify(verify(token, now + 901)));

const noneToken = b64url({ alg: "none", typ: "JWT" }) + "." + forgedBody + ".";
console.log("4 alg none:", JSON.stringify(verify(noneToken, now + 60)));
`,
        codePython: `import base64
import hashlib
import hmac
import json

SECRET = b"prompters-demo-secret"  # real apps: long random value from an env variable


def b64url(obj):
    raw = json.dumps(obj, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def b64url_bytes(part):
    return base64.urlsafe_b64decode(part + "=" * (-len(part) % 4))


def sign(payload):
    header = b64url({"alg": "HS256", "typ": "JWT"})
    body = b64url(payload)
    sig = hmac.new(SECRET, f"{header}.{body}".encode(), hashlib.sha256).digest()
    return f"{header}.{body}." + base64.urlsafe_b64encode(sig).rstrip(b"=").decode()


def verify(token, now):
    parts = token.split(".")
    if len(parts) != 3:
        return {"ok": False, "reason": "malformed"}
    h, b, s = parts
    header = json.loads(b64url_bytes(h))
    if header.get("alg") != "HS256":
        return {"ok": False, "reason": "unexpected alg " + str(header.get("alg"))}
    expected = hmac.new(SECRET, f"{h}.{b}".encode(), hashlib.sha256).digest()
    if not hmac.compare_digest(b64url_bytes(s), expected):
        return {"ok": False, "reason": "bad signature"}
    payload = json.loads(b64url_bytes(b))
    if payload["exp"] <= now:
        return {"ok": False, "reason": "expired"}
    return {"ok": True, "payload": payload}


def show(result):
    return json.dumps(result, separators=(",", ":"))


now = 1700000000
token = sign({"sub": "42", "role": "user", "iat": now, "exp": now + 900})
print("token:", token)
print("1 valid:   ", show(verify(token, now + 60)))

h, _, s = token.split(".")
forged_body = b64url({"sub": "42", "role": "admin", "iat": now, "exp": now + 900})
print("2 tampered:", show(verify(f"{h}.{forged_body}.{s}", now + 60)))
print("3 expired: ", show(verify(token, now + 901)))

none_token = b64url({"alg": "none", "typ": "JWT"}) + "." + forged_body + "."
print("4 alg none:", show(verify(none_token, now + 60)))
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `JWT ki sabse common (aur khatarnak) galtiyan:

- **Payload ko secret samajhna**: password, Aadhaar, phone number token mein daal diya — jwt.io pe paste karke koi bhi padh lega.
- **Sirf decode karna, verify nahi**: \`jwt.decode()\` (bina signature check) se user nikal liya → koi bhi fake token bana ke admin ban sakta hai. Hamesha \`jwt.verify()\`.
- **Algorithm pin na karna**: \`alg: none\` ya RS256/HS256 confusion attacks. \`algorithms: ["HS256"]\` explicitly do.
- **Kamzor secret**: \`"secret"\` ya \`"123456"\` — offline brute force ho jaata hai. 256-bit random secret, env variable mein, code/Git mein nahi.
- **Bahut lambi expiry**: 30 din ka access token — chori hua to 30 din tak valid. Access token 5–15 minute.
- **Logout ko server-side bhoolna**: client ne token delete kiya, par token abhi bhi valid hai. Refresh token revoke karo.
- **Token URL mein bhejna** (\`?token=...\`) — logs aur browser history mein leak.
- **\`exp\` check bhoolna** custom code mein.`,
          en: `Common and dangerous JWT mistakes:

- **Treating the payload as secret**; anyone can decode it.
- **Decoding without verifying**, letting anyone forge an admin token. Always verify.
- **Not pinning the algorithm**, enabling \`alg: none\` or algorithm-confusion attacks.
- **Weak secrets** like \`"secret"\`, which can be brute-forced offline; use 256-bit random secrets from env variables.
- **Long-lived access tokens**; keep them to 5–15 minutes.
- **Logout that only deletes the client copy**; revoke the refresh token.
- **Tokens in URLs**, which leak into logs.
- **Forgetting the \`exp\` check** in custom code.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `JWT auth fail ho raha hai? Step by step:

1. **Token aa bhi raha hai?** DevTools → Network → request headers mein \`Authorization: Bearer eyJ...\` hai? "Bearer " prefix aur space sahi hai?
2. **Payload decode karke dekho** (sirf debugging ke liye, local tool ya \`node -e\` se — production tokens public websites pe paste mat karo):

\`\`\`bash
node -e "console.log(Buffer.from(process.argv[1].split('.')[1], 'base64url').toString())" "<token>"
\`\`\`

3. **\`exp\` check karo**: Unix seconds mein hai, milliseconds mein nahi? (\`Date.now()\` ms deta hai — classic bug, token 1000x der se expire hota hai ya turant.) Server aur client ki ghadi ka farak (clock skew) — thoda \`clockTolerance\` do.
4. **"invalid signature"**: sign aur verify mein secret alag hai? Staging ka token production pe? Env variable load hua?
5. **"invalid algorithm"**: issuer RS256 bhej raha hai aur tum HS256 expect kar rahe ho.
6. **401 vs 403**: token galat/expired → 401; token sahi par role/permission nahi → 403.`,
          en: `When JWT auth fails:

1. **Is the token sent?** Check the \`Authorization: Bearer ...\` header in DevTools.
2. **Decode the payload locally** for debugging (never paste production tokens into public websites).
3. **Check \`exp\`**: it is Unix **seconds**, not milliseconds; \`Date.now()\` returns milliseconds. Allow small clock skew.
4. **"Invalid signature"**: mismatched secrets between environments or an unloaded env variable.
5. **"Invalid algorithm"**: the issuer uses RS256 but you expect HS256.
6. **401 vs 403**: bad or expired token is 401; valid token without permission is 403.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `JWT vs server sessions — dono ke apne fayde:

- **Revocation**: session delete karo → user turant logout. JWT expire hone tak valid rehta hai; turant revoke ke liye denylist (Redis) chahiye — jo phir stateful ho gaya.
- **Size**: JWT har request ke saath jaata hai (kuch sau bytes se KB tak); session id chhota hai.
- **Stale claims**: user ka role badla, par purane token mein abhi bhi purana role — expiry tak.
- **Scale/microservices**: JWT bina shared store ke verify ho jaata hai — yahan JWT jeet-ta hai.

**Kab kya use karein**:
- Simple web app (ek backend, browser client) → **session cookie** (HttpOnly, Secure, SameSite) aksar simple aur safer hai.
- Mobile apps, multiple services, third-party API access → **JWT access token (short) + refresh token (revocable, rotated)**.
- Khud mat banao — Auth0/Cognito/Firebase/Supabase jaisa provider, ya well-tested library use karo.`,
          en: `JWT vs server sessions:

- **Revocation**: deleting a session logs the user out instantly; a JWT stays valid until expiry unless you add a denylist, which is state again.
- **Size**: JWTs travel with every request; session ids are tiny.
- **Stale claims**: role changes do not reach old tokens until they expire.
- **Scale**: JWTs verify without a shared store, which suits microservices.

A simple web app with one backend is often simpler and safer with **HttpOnly session cookies**. Mobile apps and multi-service systems benefit from **short access JWTs plus revocable, rotated refresh tokens**. Prefer proven providers or libraries.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Real Express project mein JWT setup:

\`\`\`js
// login: password verify ke baad
const accessToken = jwt.sign(
  { sub: user.id, role: user.role },
  process.env.JWT_SECRET,
  { algorithm: "HS256", expiresIn: "15m", issuer: "campuskart-api" }
);
// refresh token: random string, DB mein hash karke store (revocable)
res.cookie("refresh", refreshToken, { httpOnly: true, secure: true, sameSite: "strict", path: "/auth/refresh" });
res.json({ accessToken });

// middleware
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"], issuer: "campuskart-api" });
    req.user = { id: p.sub, role: p.role };
    next();
  } catch { res.status(401).json({ error: "Invalid or expired token" }); }
}
\`\`\`

Logout pe refresh token DB se delete. Password change pe us user ke saare refresh tokens revoke. Access token frontend memory mein, localStorage mein nahi.`,
          en: `In a real Express project, login signs a 15-minute HS256 access token with \`sub\` and \`role\`, an issuer, and a secret from \`process.env\`. A random refresh token is stored hashed in the database and sent as an \`HttpOnly\`, \`Secure\`, \`SameSite=strict\` cookie scoped to \`/auth/refresh\`.

A \`requireAuth\` middleware strips "Bearer ", calls \`jwt.verify\` with \`algorithms: ["HS256"]\` and the issuer, sets \`req.user\`, or returns 401. Logout deletes the refresh token; a password change revokes all of them. The access token lives in memory, not localStorage.`,
        },
      },
    ],
    visualization: {
      kind: "REQUEST_RESPONSE",
      title: "Login and an authenticated request with JWT",
      steps: [
        { title: "Login request", description: "Client sends POST /auth/login with email and password over HTTPS.", highlight: "POST /auth/login" },
        { title: "Server verifies and signs", description: "Password hash matches, so the server signs { sub: 42, role: 'user', exp: now+15m } with its secret.", highlight: "HMAC-SHA256" },
        { title: "Token returned", description: "Access token goes in the response body; refresh token in an HttpOnly cookie.", highlight: "header.payload.signature" },
        { title: "Authenticated request", description: "Client calls GET /api/orders with Authorization: Bearer <token>.", highlight: "Bearer" },
        { title: "Middleware verifies", description: "Server checks alg, recomputes the signature, checks exp, sets req.user = { id: 42 }.", highlight: "verify" },
        { title: "Response", description: "Valid → 200 with the user's orders. Tampered or expired → 401.", highlight: "200 / 401" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What are the three parts of a JWT, in order?",
        options: ["payload.header.signature", "header.payload.signature", "signature.payload.header", "username.password.signature"],
        correct: [1],
        explanation: "JWT = **header.payload.signature**. Header mein algorithm, payload mein claims, aur signature dono ko secret se sign karta hai.",
        tags: ["structure"],
      },
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "Is the payload of a standard signed JWT (HS256) encrypted?",
        options: [
          "Yes, only the server can read it",
          "No, it is only Base64url-encoded; anyone holding the token can read it",
          "Yes, with the user's password",
          "Only the exp claim is encrypted",
        ],
        correct: [1],
        explanation: "Signed JWT ka payload **sirf encoded** hai — koi bhi decode kar sakta hai. Signature sirf **tampering** rokta hai, padhna nahi. Isliye payload mein secrets mat daalo.",
        tags: ["security"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "Why can't a user change \"role\": \"user\" to \"role\": \"admin\" in their token and gain admin access?",
        options: [
          "Because the payload is encrypted",
          "Because the server recomputes the signature with its secret, and the modified payload no longer matches",
          "Because browsers block editing tokens",
          "Because JWTs can only be used once",
        ],
        correct: [1],
        explanation: "Payload badla to HMAC badal jaata hai. User ke paas secret nahi hai, isliye sahi signature bana nahi sakta → server **bad signature** bol ke reject karta hai (bas server verify kare, sirf decode nahi).",
        tags: ["signature"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these are standard JWT claims that are appropriate to include? (Select all that apply)",
        options: ["exp (expiry time)", "sub (subject / user id)", "iat (issued at)", "password (the user's password hash)"],
        correct: [0, 1, 2],
        explanation: "\`exp\`, \`sub\`, \`iat\` registered claims hain. Password ya uska hash **kabhi** token mein nahi — payload sab padh sakte hain.",
        tags: ["claims"],
      },
      {
        type: "PREDICT_OUTPUT",
        difficulty: 2,
        prompt: "Without knowing the server's secret, this script reads a JWT. What does it print?",
        code: `import base64, json
token = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
         "eyJzdWIiOiI0MiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTcwMDAwMzYwMH0."
         "9e_JV-e5IkHghExUFP0a_ofnvckS9KizdLk2tCuDzBw")
payload = token.split(".")[1]
payload += "=" * (-len(payload) % 4)
data = json.loads(base64.urlsafe_b64decode(payload))
print(data["sub"], data["role"])`,
        codeLanguage: "python",
        options: ["42 admin", "Error: signature required", "42 user", "None None"],
        correct: [0],
        explanation: "Payload sirf base64url hai — padding jod ke decode karo aur JSON mil jaata hai: \`sub = \"42\"\`, \`role = \"admin\"\`. **Secret ki zaroorat hi nahi** padhne ke liye. Isliye sensitive data token mein mat rakho, aur decode ko kabhi verify mat samjho.",
        tags: ["decode"],
      },
      {
        type: "SCENARIO",
        difficulty: 3,
        prompt: "Your app issues JWT access tokens valid for 7 days. A user reports their phone was stolen, and an admin bans a spammer — but both tokens keep working. What design change fixes this?",
        options: [
          "Make tokens valid for 30 days so users log in less",
          "Use short-lived access tokens (e.g. 15 min) plus refresh tokens stored server-side that can be revoked; optionally a denylist for urgent revocation",
          "Store the JWT secret in the frontend",
          "Switch the algorithm to alg: none",
        ],
        correct: [1],
        explanation: "Stateless JWT expiry tak valid rehta hai. Access token **chhota** rakho aur naya token sirf **refresh token** se milta hai jo DB mein hai — usse delete karo to user max 15 minute mein bahar. Turant zaroorat ho to \`jti\` denylist.",
        tags: ["revocation"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the JWT authentication flow.",
        options: [
          "User submits email and password to /auth/login",
          "Server verifies the password hash",
          "Server signs a JWT with sub, role and exp",
          "Client sends the token in the Authorization: Bearer header on later requests",
          "Auth middleware verifies algorithm, signature and expiry, then sets req.user",
        ],
        explanation: "Login → password check → token sign → client har request pe token bhejta hai → middleware verify karke user attach karta hai.",
        tags: ["flow"],
      },
      {
        type: "EXPLAIN",
        difficulty: 3,
        prompt: "Why must the server pin the expected algorithm (e.g. only HS256) when verifying JWTs?",
        keywords: ["alg none", "header", "attacker", "algorithm confusion", "reject"],
        explanation: "Header attacker ke control mein hai. Agar server header ka \`alg\` blindly maane to attacker \`alg: none\` (bina signature) ya RS256/HS256 confusion se fake token pass karwa sakta hai. Isliye server khud batata hai kaunsa algorithm allowed hai aur baaki reject.",
        tags: ["security"],
      },
    ],
    buildTask: {
      title: "Decode a JWT payload",
      description: `JWT ka payload padhna seekho (aur samjho ki ye kyun secret nahi hai). Likho \`decodeJwtPayload(token)\`:

- Token ko \`.\` pe split karo. **Exactly 3 parts** nahi hain to \`null\` return karo.
- Beech wala part **base64url** hai: \`-\` → \`+\`, \`_\` → \`/\`, aur padding (\`=\`) missing ho sakti hai.
- Decode karke UTF-8 text ko JSON parse karo aur object return karo.
- Decode ya JSON parse fail ho to \`null\`.

**Dhyaan do**: ye function signature **verify nahi karta**. Real auth mein sirf decode pe kabhi bharosa mat karna.`,
      functionName: "decodeJwtPayload",
      starterJs: `function decodeJwtPayload(token) {
  // split, base64url-decode the middle part, JSON.parse it
  return null;
}
`,
      starterPython: `def decodeJwtPayload(token):
    # split, base64url-decode the middle part, json.loads it
    return None
`,
      tests: [
        {
          name: "basic user token",
          args: ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInJvbGUiOiJ1c2VyIiwiZXhwIjoxNzAwMDAzNjAwfQ.GiyGyAHafNVjg3RzRWy78-lpLUSCC3fpC-sre3khCcc"],
          expected: { sub: "42", role: "user", exp: 1700003600 },
        },
        {
          name: "admin token with iat",
          args: ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3IiwibmFtZSI6IkFzaGEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDkwMH0.cVTQ4THuXztPZqmA-P7yfoAjoHEW92J1PaBkccU4a3Y"],
          expected: { sub: "7", name: "Asha", role: "admin", iat: 1700000000, exp: 1700000900 },
        },
        {
          name: "nested array claim",
          args: ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1Xzk5IiwidGVuYW50SWQiOiJ0LTEiLCJzY29wZXMiOlsib3JkZXJzOnJlYWQiLCJvcmRlcnM6d3JpdGUiXX0.RHln-LyWK1BF-OxZ1X0XiQeN1Aqicm-ZJleZe95x6L4"],
          expected: { sub: "u_99", tenantId: "t-1", scopes: ["orders:read", "orders:write"] },
        },
        {
          name: "url-safe characters - and _",
          args: ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1Iiwibm90ZSI6Ij4-Pj8_P35-fiJ9.0T3aVbU9VC5x91qjhOzpm2xVWaOe1Lnuh7YuOSqDkBs"],
          expected: { sub: "5", note: ">>>???~~~" },
        },
        {
          name: "only two parts",
          args: ["abc.def"],
          expected: null,
        },
        {
          name: "unicode payload",
          args: ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6Ilpvw6sg4pyTIiwib2siOnRydWUsIm4iOm51bGx9.FtdBsq1ucWDqJXilD22Dqz_j_3dCvO62xxpaOLrIDkM"],
          expected: { sub: "1", name: "Zoë ✓", ok: true, n: null },
          hidden: true,
        },
        {
          name: "payload is not JSON",
          args: ["eyJhbGciOiJIUzI1NiJ9.bm90IGpzb24.sig"],
          expected: null,
          hidden: true,
        },
      ],
      hints: [
        "Base64url = normal Base64, bas '+' ki jagah '-', '/' ki jagah '_', aur end ka '=' padding hata diya jaata hai. Decode se pehle ulta karo.",
        "Steps: split('.') → length 3 check → parts[1] mein '-'→'+', '_'→'/' → length 4 ka multiple banane tak '=' jodo → decode → UTF-8 string → JSON parse. Poora try/catch mein.",
        "Python: seg = token.split('.')[1]; seg += '=' * (-len(seg) % 4); return json.loads(base64.urlsafe_b64decode(seg).decode('utf-8'))  |  JS (Node): JSON.parse(Buffer.from(seg, 'base64url').toString('utf8'))",
      ],
      explainQuestions: [
        { question: "Why does base64url need padding fixed before decoding in some languages?", keywords: ["padding", "multiple of 4", "equals sign", "stripped"] },
        { question: "Why is it dangerous to authenticate a user using only decodeJwtPayload? (security)", keywords: ["no signature check", "forge", "anyone", "verify"] },
        { question: "What kind of data should never be put in a JWT payload, and why?", keywords: ["readable", "secrets", "password", "personal data"] },
      ],
      estMinutes: 20,
    },
    interview: [
      {
        question: "JWT vs session — which would you use and why?",
        short: "Sessions store state on the server and give the client an opaque id in a cookie; they are easy to revoke and simple for a single web backend. JWTs are self-contained signed tokens verified without a lookup, which suits mobile clients and multiple services, but they are hard to revoke before expiry. I default to HttpOnly session cookies for a simple web app, and short-lived JWTs with revocable refresh tokens for distributed or mobile systems.",
        deep: `- **State**: sessions keep it on the server (DB/Redis); a JWT carries it inside the token.
- **Per-request cost**: session = store lookup; JWT = signature verification.
- **Revocation**: delete a session and it is gone instantly; a JWT lives until \`exp\` unless you add a denylist.
- **Size on the wire**: a small session id vs a token of hundreds of bytes or more.
- **Multiple services**: sessions need a shared store; JWTs can be verified with a shared or public key.
- Role changes apply instantly with sessions; JWT claims are stale until expiry.
- A hybrid is common: short access JWT (5–15 min) + server-stored refresh token, rotated on use with reuse detection.
- Both need HTTPS, CSRF protection when cookies are used, and XSS defences.`,
        followUps: ["How would you log a user out of all devices with JWTs?", "What is refresh token rotation?", "Does using JWT remove the need for CSRF protection?"],
        commonMistake: "Claiming JWTs are 'more secure' than sessions, or that they are always better because they are stateless.",
        keywords: ["stateless", "revocation", "server-side state", "refresh token", "short-lived"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK"],
      },
      {
        question: "Where should a JWT be stored on the client?",
        short: "For browsers, prefer keeping the refresh token in an HttpOnly, Secure, SameSite cookie, which JavaScript cannot read, and keep the short-lived access token in memory. Avoid localStorage for long-lived tokens because any XSS can steal them. If you put auth tokens in cookies, add CSRF protection. On mobile, use the platform's secure storage like Keychain or Keystore.",
        deep: `- **localStorage/sessionStorage**: easy, but readable by any script on the page — one XSS bug or malicious npm dependency leaks the token.
- **HttpOnly cookie**: not readable by JS (XSS cannot exfiltrate it directly), sent automatically, so you need \`SameSite=Lax/Strict\` and/or CSRF tokens.
- **In-memory access token**: lost on refresh; get a new one silently via the refresh cookie at \`/auth/refresh\`.
- **Mobile**: iOS Keychain, Android Keystore/EncryptedSharedPreferences.
- Never put tokens in URLs (logs, Referer headers, history).`,
        followUps: ["How does SameSite help against CSRF?", "If XSS exists, does an HttpOnly cookie make you fully safe?", "How do you refresh the access token silently?"],
        commonMistake: "Storing a 30-day token in localStorage and assuming HTTPS alone protects it.",
        keywords: ["httponly cookie", "xss", "csrf", "in memory", "localstorage"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK", "FRONTEND"],
      },
      {
        question: "How do you revoke JWTs or log a user out?",
        short: "Because JWTs are valid until they expire, keep access tokens short-lived and store refresh tokens server-side so logout deletes them. For immediate revocation, keep a denylist of token ids (jti) in Redis until their expiry, or store a per-user token version checked on each request.",
        deep: `- **Short access tokens** bound the damage window.
- **Refresh tokens**: random, stored hashed in the DB, rotated on every use; reuse of an old one signals theft → revoke the whole family.
- **Denylist**: \`SET revoked:<jti> 1 EX <seconds until exp>\`; check in auth middleware (adds a lookup).
- **Token version**: \`users.token_version\` included as a claim; bump it on password change to invalidate all tokens (requires a lookup or cache).
- Rotating the signing secret invalidates everyone — an emergency lever.`,
        followUps: ["What is refresh token reuse detection?", "Doesn't a denylist make JWT stateful again?"],
        commonMistake: "Saying logout is done by deleting the token on the client only.",
        keywords: ["short-lived", "refresh token", "denylist", "jti", "rotation"],
        difficulty: 3,
        roles: ["BACKEND", "SDE"],
      },
    ],
    promptCard: {
      title: "Review my JWT authentication code",
      category: "CODE_REVIEW",
      task: "Get a focused security review of how your backend issues, stores and verifies JWTs.",
      whenToUse: "After implementing login/refresh/logout, or before launching an app that uses JWTs.",
      template: `You are a senior application security engineer reviewing JWT authentication.

Stack: [STACK]
How tokens are issued (login/refresh code): [ISSUE_CODE]
How tokens are verified (middleware code): [VERIFY_CODE]
Where the client stores tokens: [CLIENT_STORAGE]

Check and report on each item, saying "no issue found" explicitly when that is the case:
1. Algorithm pinned on verify; alg none / algorithm confusion impossible
2. Secret or key strength and where it is loaded from
3. exp, iss, aud checked; access token lifetime
4. Refresh token design: storage, rotation, revocation on logout and password change
5. Sensitive data in the payload
6. Client storage risks (XSS, CSRF) and cookie flags
7. Error handling: 401 vs 403, no internal details leaked

For each issue: quote the line, explain the attack in one or two sentences, and give the fixed code.`,
      variables: [
        { key: "STACK", label: "e.g. Express + jsonwebtoken, FastAPI + PyJWT" },
        { key: "ISSUE_CODE", label: "Your login and refresh handler code" },
        { key: "VERIFY_CODE", label: "Your auth middleware / dependency code" },
        { key: "CLIENT_STORAGE", label: "e.g. localStorage, HttpOnly cookie, memory" },
      ],
      whyItWorks: [
        { part: "Fixed checklist", why: "Covers the known JWT failure modes instead of a vague 'looks fine'." },
        { part: "Explicit 'no issue found'", why: "Shows which areas were actually checked, so silence is not mistaken for safety." },
        { part: "Quote the line + attack + fix", why: "Makes each finding verifiable and directly actionable." },
        { part: "Client storage included", why: "Many JWT problems are about where tokens live, not how they are signed." },
      ],
      verifyChecklist: [
        "Try a token with alg none and a tampered payload — both must get 401",
        "Try an expired token — 401",
        "Confirm the secret comes from an environment variable and is long and random",
        "Log out, then try the old refresh token — it must fail",
        "Decode a token and confirm no sensitive data is inside",
      ],
      sampleOutput: `1. Algorithm: ISSUE — line 14 \`jwt.verify(token, secret)\` has no algorithms option. Fix: \`jwt.verify(token, secret, { algorithms: ["HS256"] })\`.
2. Secret: ISSUE — "mysecret" hard-coded on line 3 can be brute-forced offline; load a 32-byte random value from process.env.JWT_SECRET.
3. Claims: no issue found (exp 15m, iss checked).
4. Refresh: ISSUE — logout only clears localStorage; delete the refresh token row server-side.
5. Payload: no issue found.`,
    },
  },
  // ───────────────────────────── 10. IDOR ─────────────────────────────
  {
    slug: "idor",
    estMinutes: 40,
    difficulty: 2,
    prerequisites: ["jwt-authentication", "rest-api-design", "rbac"],
    objectives: [
      "Explain IDOR and why authentication alone does not stop it",
      "Enforce ownership and tenant scoping inside every data query",
      "Choose between 403 and 404 responses for resources a user may not see",
      "Write tests that try to access another user's resources",
    ],
    technicalDefinition:
      "Insecure Direct Object Reference (IDOR), classified by OWASP under Broken Access Control (and as Broken Object Level Authorization, BOLA, in the OWASP API Security Top 10), is a vulnerability where an application exposes a reference to an internal object such as a database id and uses it to fetch or modify that object without verifying that the authenticated user is authorised to access it.",
    sections: [
      {
        type: "DEFINITION",
        content: {
          hinglish: `**IDOR (Insecure Direct Object Reference)** wo bug hai jisme user URL ya body mein **id badal ke kisi aur ka data** dekh ya badal leta hai — kyunki server ne check hi nahi kiya ki "ye cheez is user ki hai bhi ya nahi".

Example: tum login ho, tumhara invoice \`GET /api/invoices/1001\` hai. Tumne URL mein \`1002\` likha — aur kisi aur customer ka invoice (naam, address, amount) khul gaya! Ye IDOR hai.

Yaad rakho do alag sawaal:
- **Authentication**: "tum kaun ho?" (login, JWT) — yahan pass ho gaya.
- **Authorization**: "kya tum **ye wali** cheez dekh sakte ho?" — yahi check missing tha.

OWASP ise **Broken Access Control** mein rakhta hai, jo web apps ki top security problem list mein sabse upar hai. APIs ke liye iska naam **BOLA** bhi hai.`,
          en: `**IDOR (Insecure Direct Object Reference)** is a bug where a user **changes an id** in the URL or body and sees or modifies **someone else's data**, because the server never checked that the object belongs to them.

Example: your invoice is \`GET /api/invoices/1001\`. You type \`1002\` and another customer's invoice opens. That is IDOR.

Two different questions:
- **Authentication**: who are you? (login, JWT) — passed.
- **Authorization**: may you access **this specific** object? — missing.

OWASP lists this under **Broken Access Control**, at the top of its web risk list; for APIs it is called **BOLA**.`,
          hi: `**IDOR (Insecure Direct Object Reference)** वह कमी है जिसमें user URL या body में **id बदलकर किसी और का डेटा** देख या बदल लेता है — क्योंकि सर्वर ने जाँचा ही नहीं कि "यह चीज़ इस user की है या नहीं"।

उदाहरण: आपका invoice \`GET /api/invoices/1001\` है। आपने URL में \`1002\` लिखा — और किसी दूसरे ग्राहक का invoice खुल गया! यही IDOR है।

दो अलग सवाल याद रखिए:
- **Authentication**: "आप कौन हैं?" — यह पास हो गया।
- **Authorization**: "क्या आप **यह वाली** चीज़ देख सकते हैं?" — यही जाँच गायब थी।

OWASP इसे **Broken Access Control** में रखता है, जो वेब सुरक्षा जोखिमों की सूची में सबसे ऊपर है।`,
        },
      },
      {
        type: "ANALOGY",
        content: {
          hinglish: `**Hostel ke locker room** socho. Gate pe guard tumhara ID card check karta hai (**authentication**) — "haan, tum is hostel ke student ho, andar jao".

Andar 200 lockers hain, har locker pe number hai. Tumhara locker 47 hai. Ab agar lockers pe **taala hi nahi** hai aur bas number likha hai, to tum locker 48 bhi khol sakte ho — guard ne to sirf gate pe check kiya tha, locker pe nahi.

Ye IDOR hai: gate ka check (login) sahi tha, par **har locker pe "ye tumhara hai?" wala taala** (ownership check) missing tha.

Locker numbers ko random bana dena (47 ki jagah "X9-QK") thoda mushkil karta hai, par taala nahi lagata — kisi ko number pata chal gaya (shared link, purana receipt) to phir khul jaayega. Asli fix: **har locker pe taala, aur chabi sirf owner (ya warden/admin) ke paas**.`,
          en: `Think of a **hostel locker room**. The guard at the gate checks your ID card (**authentication**): yes, you live here, go in.

Inside are 200 numbered lockers; yours is 47. If lockers have **no locks**, only numbers, you can open locker 48 too. The guard only checked the gate, not the lockers.

That is IDOR: the gate check (login) worked, but the **per-locker "is this yours?" lock** (ownership check) was missing.

Random locker numbers make guessing harder but are not locks; once someone learns a number, it opens. The real fix is **a lock on every locker, with keys only for the owner or the warden (admin)**.`,
          hi: `**हॉस्टल का लॉकर रूम** सोचिए। गेट पर गार्ड आपका पहचान पत्र जाँचता है (**authentication**) — "हाँ, आप यहाँ के छात्र हैं, अंदर जाइए"।

अंदर 200 लॉकर हैं, हर एक पर नंबर। आपका लॉकर 47 है। अगर लॉकरों पर **ताला ही नहीं**, सिर्फ़ नंबर है, तो आप लॉकर 48 भी खोल सकते हैं।

यही IDOR है: गेट की जाँच सही थी, पर **हर लॉकर पर "क्या यह आपका है?" वाला ताला** गायब था।

नंबर बेतरतीब बना देने से अंदाज़ा लगाना कठिन होता है, पर ताला नहीं लगता। असली उपाय: **हर लॉकर पर ताला, चाबी सिर्फ़ मालिक या वार्डन के पास**।`,
        },
      },
      {
        type: "WHY",
        content: {
          hinglish: `IDOR itna common aur khatarnak kyun hai?

- **Banana bahut aasaan hai**: \`findById(req.params.id)\` likhna natural lagta hai. Developer sochta hai "user logged in hai, to theek hai" — par ye bhool jaata hai ki logged-in user **koi bhi id** bhej sakta hai.
- **Exploit karna aur bhi aasaan**: koi hacking tool nahi chahiye — browser ka URL ya Postman mein ek number badlo. Script se 1 se 1,00,000 tak loop chala do aur poora database download.
- **Impact bada**: invoices, medical reports, KYC documents, private messages, addresses — sab leak. Data protection laws (jaise India ka DPDP Act) ke under ye serious incident hai.
- **Write wala IDOR aur bura**: \`DELETE /addresses/555\` ya \`PATCH /orders/9/status\` — kisi aur ka data badal/delete.

Bug bounty programs mein IDOR sabse zyada report hone wale bugs mein se hai. Isliye "har query mein ownership" backend ka basic rule hai.`,
          en: `Why IDOR is common and dangerous:

- **Easy to write**: \`findById(req.params.id)\` feels natural, and developers assume "logged in" means "allowed".
- **Easy to exploit**: no tools needed; change a number in the URL, or loop over ids with a script to download everything.
- **High impact**: invoices, medical reports, KYC documents, messages and addresses leak, a serious incident under data protection laws like India's DPDP Act.
- **Write IDORs are worse**: deleting or editing other people's data.

IDOR is among the most reported bug-bounty findings, so ownership checks in every query are a basic rule.`,
        },
      },
      {
        type: "USAGE",
        content: {
          hinglish: `Real duniya mein IDOR kahan dikhta hai:

- **OWASP API Security Top 10** mein "Broken Object Level Authorization" (BOLA) **number 1** pe hai — matlab APIs mein sabse common aur serious risk.
- **Bug bounty platforms** (HackerOne, Bugcrowd) pe public disclosed reports mein IDOR bahut aam hai — jaise kisi app mein order id badal ke doosre users ke order details ya addresses dikh jaana.
- **Food delivery / e-commerce apps**: \`/orders/:id\`, \`/addresses/:id\`, \`/invoices/:id\` classic targets hain — inme naam, phone, ghar ka address hota hai.
- **SaaS / multi-tenant apps (jaise CRM, HR software)**: URL mein \`/orgs/12/employees\` — org id badal ke doosri company ka data. Isliye in apps mein har query **tenant ke hisaab se scope** hoti hai, aur kai teams Postgres **row-level security** bhi lagati hain.`,
          en: `Where IDOR shows up:

- **OWASP API Security Top 10** ranks Broken Object Level Authorization (**BOLA**) as **#1**.
- **Bug bounty platforms** like HackerOne and Bugcrowd have many publicly disclosed IDOR reports, such as changing an order id to see other users' orders or addresses.
- **Food-delivery and e-commerce apps**: \`/orders/:id\`, \`/addresses/:id\` and \`/invoices/:id\` are classic targets.
- **Multi-tenant SaaS** (CRM, HR tools): changing \`/orgs/12\` exposes another company, so every query is **tenant-scoped**, sometimes backed by Postgres **row-level security**.`,
        },
      },
      {
        type: "INTERNALS",
        content: {
          hinglish: `Vulnerable flow:
1. Request: \`GET /api/invoices/1002\` with valid JWT of user 7.
2. Auth middleware: token sahi → \`req.user = { id: 7 }\`. ✅
3. Handler: \`SELECT * FROM invoices WHERE id = 1002\` — **user ka koi zikr nahi**.
4. Invoice 1002 (user 9 ka) return. ❌

Secure flow — ownership **query ke andar**:

\`\`\`sql
SELECT id, amount, status FROM invoices
WHERE id = $1 AND user_id = $2      -- $2 = req.user.id (token se)
\`\`\`

- Row mili → user ki hai → 200.
- Row nahi mili → ya to exist nahi karti ya kisi aur ki hai → dono case mein **404** (taaki attacker ko pata na chale ki id 1002 exist karti hai).

Multi-tenant mein \`AND tenant_id = $3\` bhi, jahan \`tenant_id\` **token/session se** aata hai, URL ya body se nahi. Admin ke liye alag rule: role check + same tenant. Ye rules ek jagah (policy function jaise \`canAccess(user, resource)\`) mein rakho taaki har route same logic use kare.`,
          en: `Vulnerable flow: user 7 requests \`/api/invoices/1002\`, auth passes, the handler runs \`SELECT * FROM invoices WHERE id = 1002\` with no user filter, and user 9's invoice is returned.

Secure flow puts ownership **in the query**: \`WHERE id = $1 AND user_id = $2\`, with \`$2\` from the token.

- Row found: it belongs to the user, return 200.
- No row: it does not exist or is someone else's; return **404** in both cases so attackers cannot probe which ids exist.

In multi-tenant apps add \`AND tenant_id = $3\` from the session, never from the URL or body. Admin rules (role plus same tenant) live in one policy function like \`canAccess(user, resource)\`.`,
        },
      },
      {
        type: "CODE",
        content: {
          hinglish: `Yahan ek fake \`invoices\` table aur do handlers hain:

- \`getInvoiceInsecure(user, id)\`: sirf id se dhundhta hai — **IDOR**.
- \`canAccess(user, invoice)\`: policy function — pehle **tenant same** hona chahiye, phir ya to user **owner** ho ya **admin**.
- \`getInvoiceSecure(user, id)\`: invoice dhundh ke \`canAccess\` check; fail ho to **404** (403 nahi, taaki existence leak na ho). Response mein sirf zaroori fields (\`id\`, \`amount\`) — internal fields nahi.

Scenarios: Asha apna invoice kholti hai (ok), Asha Ravi ka invoice kholti hai (insecure version mein leak, secure mein 404), same company ka admin (ok), doosri company ka admin (404).

Real Express/Prisma mein best tareeka ownership ko **query mein hi** daalna hai:

\`\`\`js
const inv = await prisma.invoice.findFirst({
  where: { id: req.params.id, userId: req.user.id, tenantId: req.user.tenantId },
});
if (!inv) return res.status(404).json({ error: "Not found" });
\`\`\``,
          en: `A fake \`invoices\` table and two handlers:

- \`getInvoiceInsecure\` looks up by id only: **IDOR**.
- \`canAccess\` is a policy: same **tenant** first, then **owner** or **admin**.
- \`getInvoiceSecure\` checks the policy and returns **404** on failure, exposing only needed fields.

Scenarios: Asha opens her invoice, Asha opens Ravi's (leaked by the insecure version, 404 in the secure one), a same-company admin, and an admin from another company.

In real Prisma code, put the filter in the query: \`findFirst({ where: { id, userId: req.user.id, tenantId: req.user.tenantId } })\`.`,
        },
        codeJs: `const invoices = [
  { id: 1001, ownerId: 7, tenantId: "acme", amount: 4999, internalNote: "VIP discount" },
  { id: 1002, ownerId: 9, tenantId: "acme", amount: 1250, internalNote: "late payer" },
  { id: 2001, ownerId: 31, tenantId: "globex", amount: 800, internalNote: "" },
];

function getInvoiceInsecure(user, id) {
  const inv = invoices.find((i) => i.id === id); // no ownership check!
  return inv ? { status: 200, body: inv } : { status: 404, body: null };
}

function canAccess(user, resource) {
  if (user.tenantId !== resource.tenantId) return false; // never cross tenants
  if (user.role === "admin") return true;
  return user.id === resource.ownerId;
}

function getInvoiceSecure(user, id) {
  const inv = invoices.find((i) => i.id === id);
  if (!inv || !canAccess(user, inv)) return { status: 404, body: null }; // same answer: no existence leak
  return { status: 200, body: { id: inv.id, amount: inv.amount } }; // only safe fields
}

const asha = { id: 7, role: "user", tenantId: "acme" };
const acmeAdmin = { id: 1, role: "admin", tenantId: "acme" };
const globexAdmin = { id: 30, role: "admin", tenantId: "globex" };

const cases = [
  ["Asha -> own invoice 1001", asha, 1001],
  ["Asha -> Ravi's invoice 1002", asha, 1002],
  ["Acme admin -> 1002", acmeAdmin, 1002],
  ["Globex admin -> 1002", globexAdmin, 1002],
];
for (const [label, user, id] of cases) {
  const bad = getInvoiceInsecure(user, id);
  const good = getInvoiceSecure(user, id);
  console.log(label);
  console.log("   insecure:", bad.status, JSON.stringify(bad.body));
  console.log("   secure:  ", good.status, JSON.stringify(good.body));
}
`,
        codePython: `import json

invoices = [
    {"id": 1001, "ownerId": 7, "tenantId": "acme", "amount": 4999, "internalNote": "VIP discount"},
    {"id": 1002, "ownerId": 9, "tenantId": "acme", "amount": 1250, "internalNote": "late payer"},
    {"id": 2001, "ownerId": 31, "tenantId": "globex", "amount": 800, "internalNote": ""},
]


def find(invoice_id):
    return next((i for i in invoices if i["id"] == invoice_id), None)


def get_invoice_insecure(user, invoice_id):
    inv = find(invoice_id)  # no ownership check!
    return (200, inv) if inv else (404, None)


def can_access(user, resource):
    if user["tenantId"] != resource["tenantId"]:
        return False  # never cross tenants
    if user["role"] == "admin":
        return True
    return user["id"] == resource["ownerId"]


def get_invoice_secure(user, invoice_id):
    inv = find(invoice_id)
    if inv is None or not can_access(user, inv):
        return 404, None  # same answer: no existence leak
    return 200, {"id": inv["id"], "amount": inv["amount"]}  # only safe fields


asha = {"id": 7, "role": "user", "tenantId": "acme"}
acme_admin = {"id": 1, "role": "admin", "tenantId": "acme"}
globex_admin = {"id": 30, "role": "admin", "tenantId": "globex"}

cases = [
    ("Asha -> own invoice 1001", asha, 1001),
    ("Asha -> Ravi's invoice 1002", asha, 1002),
    ("Acme admin -> 1002", acme_admin, 1002),
    ("Globex admin -> 1002", globex_admin, 1002),
]
for label, user, invoice_id in cases:
    bad_status, bad_body = get_invoice_insecure(user, invoice_id)
    good_status, good_body = get_invoice_secure(user, invoice_id)
    print(label)
    print("   insecure:", bad_status, json.dumps(bad_body))
    print("   secure:  ", good_status, json.dumps(good_body))
`,
      },
      {
        type: "MISTAKES",
        content: {
          hinglish: `IDOR ki jadein in galtiyon mein hoti hain:

- **"Logged in hai to allowed hai"**: \`requireAuth\` laga diya aur soch liya kaam ho gaya. Auth sirf identity batata hai, permission nahi.
- **Owner id body/URL se lena**: \`POST /orders\` body mein \`userId: 9\` bhej diya aur server ne maan liya. Owner hamesha \`req.user.id\` (token) se.
- **UUID ko security samajhna**: random ids guess karna mushkil hai, par ids leak hoti hain — share links, logs, emails, doosre API responses mein. UUID + ownership check, dono.
- **Sirf GET pe check**: \`GET /addresses/:id\` secure, par \`PATCH\` aur \`DELETE\` wale routes bhool gaye.
- **Frontend pe chhupana**: "button hi nahi dikhaya" — API to phir bhi khuli hai.
- **List endpoint mein filter**: \`GET /invoices?userId=9\` — query param se kisi ka bhi data. Filter server pe \`req.user\` se lagao.
- **Nested resources**: \`/projects/5/tasks/77\` — check kiya ki project 5 user ka hai, par ye nahi ki task 77 project 5 ka hi hai!`,
          en: `Root causes of IDOR:

- **"Logged in means allowed"**: authentication is not authorization.
- **Taking the owner id from the body or URL** instead of \`req.user.id\`.
- **Relying on UUIDs**: ids leak through share links, logs and other responses.
- **Checking only GET**, forgetting PATCH and DELETE.
- **Hiding buttons in the frontend** while the API stays open.
- **List filters from query params** like \`?userId=9\`.
- **Nested resources**: checking project 5 but not that task 77 belongs to project 5.`,
        },
      },
      {
        type: "DEBUGGING",
        content: {
          hinglish: `IDOR dhundhne aur rokne ka practical tareeka:

1. **Do test accounts banao** (User A, User B). A se ek resource banao, uski id note karo. B ke token se wahi id \`GET\`, \`PATCH\`, \`DELETE\` karo. **404/403 aana chahiye**, 200 nahi.
2. **Automated test** likho har resource route ke liye:

\`\`\`js
it("user B cannot read user A's invoice", async () => {
  const res = await request(app)
    .get("/api/invoices/" + invoiceOfA.id)
    .set("Authorization", "Bearer " + tokenB);
  expect(res.status).toBe(404);
});
\`\`\`

3. **Code search**: \`grep -rn "findUnique({ where: { id"\` ya \`WHERE id = \` — har jagah dekho ki saath mein \`userId\`/\`tenantId\` filter hai ya nahi.
4. **Logs**: ek user bahut saari alag-alag ids pe 404 le raha hai (\`/invoices/1001, 1002, 1003...\`) → enumeration attempt. Alert + rate limit.
5. **Burp Suite / OWASP ZAP** jaise tools se security testing mein ids swap karke check karte hain.`,
          en: `Finding and preventing IDOR:

1. **Two test accounts**: create a resource as A, then try GET, PATCH and DELETE on it with B's token. Expect 404 or 403, never 200.
2. **Automated tests** for every resource route asserting that user B gets 404 for user A's object.
3. **Code search** for lookups by id alone, like \`findUnique({ where: { id\`, and confirm a \`userId\` or \`tenantId\` filter.
4. **Logs**: one user hitting many sequential ids with 404s signals enumeration; alert and rate-limit.
5. Security testers swap ids with tools like **Burp Suite** or **OWASP ZAP**.`,
        },
      },
      {
        type: "TRADEOFFS",
        content: {
          hinglish: `Authorization kahan aur kaise lagayein — options:

- **Query mein filter** (\`WHERE id = ? AND user_id = ?\`): simple, fast, ek hi DB call. Har route pe yaad rakhna padta hai.
- **Central policy function / library** (\`canAccess\`, CASL, Oso, Casbin): rules ek jagah, test karna aasaan. Par resource pehle load karna padta hai.
- **Repository layer scoping**: \`invoiceRepo.forUser(user).findById(id)\` — developer chahe to bhi bina scope ke query nahi kar sakta. Bade codebases mein bahut useful.
- **Postgres Row-Level Security (RLS)**: DB khud har query pe tenant/user filter lagata hai — defense in depth. Setup aur debugging thoda complex, aur connection pooling ke saath dhyaan chahiye.

**403 vs 404**: 404 se attacker ko pata nahi chalta ki resource exist karta hai (privacy better). 403 debugging aur UX mein clear hai (jaise "aapko is project ka access nahi, admin se maango"). Private user data ke liye aksar 404, shared team resources ke liye 403 theek hai. Jo bhi chuno, **consistent** raho.`,
          en: `Where to enforce authorization:

- **Filters in the query**: simple and fast, but must be remembered on every route.
- **A central policy** (\`canAccess\`, CASL, Oso, Casbin): one place for rules, easy to test, needs the resource loaded first.
- **Repository scoping** like \`invoiceRepo.forUser(user)\`: makes unscoped queries hard to write.
- **Postgres row-level security**: the database enforces it as defence in depth, with more setup complexity.

**403 vs 404**: 404 hides existence (better privacy); 403 is clearer for shared team resources. Be **consistent**.`,
        },
      },
      {
        type: "REAL_PROJECT",
        content: {
          hinglish: `Ek multi-tenant SaaS (maan lo college placement portal, har college ek tenant) mein IDOR se bachne ka setup:

\`\`\`js
// 1) tenant aur user hamesha token se
app.use("/api", requireAuth); // sets req.user = { id, role, tenantId }

// 2) repository jo bina scope ke query hone hi nahi deta
const studentRepo = (user) => ({
  findById: (id) => db.student.findFirst({ where: { id, tenantId: user.tenantId } }),
});

// 3) route + policy
app.get("/api/students/:id", async (req, res) => {
  const s = await studentRepo(req.user).findById(req.params.id);
  if (!s || !(req.user.role === "admin" || s.userId === req.user.id)) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(toStudentDTO(s)); // no internal fields
});
\`\`\`

CI mein har resource ke liye "cross-user" aur "cross-tenant" tests chalte hain. PR review checklist mein ek line: **"Har naye route mein ownership/tenant check hai?"** Aur security review ke liye neeche wala prompt card bahut kaam aata hai.`,
          en: `In a multi-tenant placement portal (each college a tenant): \`requireAuth\` sets \`req.user = { id, role, tenantId }\` from the token; a repository function always adds \`tenantId: user.tenantId\` to queries; the route returns 404 unless the user is an admin or the student record's owner, and responds through a DTO without internal fields.

CI runs cross-user and cross-tenant tests for every resource, and the PR checklist asks: "Does every new route check ownership and tenant?" The prompt card below helps with that review.`,
        },
      },
    ],
    visualization: {
      kind: "REQUEST_RESPONSE",
      title: "An IDOR attempt: vulnerable vs secure",
      steps: [
        { title: "Attacker logs in normally", description: "User 7 gets a valid JWT. Authentication is working.", highlight: "valid token" },
        { title: "Changes the id", description: "Instead of /api/invoices/1001 (theirs), they request /api/invoices/1002.", highlight: "1001 → 1002" },
        { title: "Vulnerable server", description: "Runs SELECT * FROM invoices WHERE id = 1002 and returns user 9's invoice. Data leaked.", highlight: "WHERE id = ?" },
        { title: "Secure server", description: "Runs WHERE id = 1002 AND user_id = 7 (user id from the token). No row matches.", highlight: "AND user_id = ?" },
        { title: "Same answer for missing or forbidden", description: "Returns 404 Not Found, so the attacker cannot tell whether invoice 1002 exists.", highlight: "404" },
      ],
    },
    questions: [
      {
        type: "MCQ",
        difficulty: 1,
        prompt: "What is an IDOR vulnerability?",
        options: [
          "A user can access or modify another user's object by changing its id, because the server does not check authorisation for that object",
          "A user cannot log in because their password is wrong",
          "The server is slow when ids are large",
          "A database index is missing on the id column",
        ],
        correct: [0],
        explanation: "IDOR = id badlo, kisi aur ka data milo — kyunki server ne **object-level authorization** check nahi kiya. Login sahi hone se ye nahi rukta.",
        tags: ["definition"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "A team switches invoice ids from 1, 2, 3 to random UUIDs. Is IDOR fixed?",
        options: [
          "Yes, UUIDs cannot be guessed so no check is needed",
          "No — UUIDs make guessing harder, but ids still leak (links, logs, other responses); the server must still check ownership",
          "Yes, if the UUIDs are lowercase",
          "No, because UUIDs are slower to index",
        ],
        correct: [1],
        explanation: "Random ids **obscurity** hai, security nahi. Id kahin se bhi leak ho sakti hai. Asli fix: har request pe server-side ownership/tenant check.",
        tags: ["uuid"],
      },
      {
        type: "MCQ",
        difficulty: 2,
        prompt: "User A requests user B's private invoice. Which response avoids revealing that the invoice exists?",
        options: ["200 with an empty body", "404 Not Found", "500 Internal Server Error", "302 redirect to the invoice"],
        correct: [1],
        explanation: "\"Exist nahi karta\" aur \"tumhara nahi hai\" dono pe **404** do — attacker ids probe karke ye nahi jaan sakta ki kaunsi exist karti hain. 403 bhi galat nahi, par existence reveal karta hai.",
        tags: ["status-codes"],
      },
      {
        type: "MULTI",
        difficulty: 2,
        prompt: "Which of these endpoints need an ownership (or tenant) check? (Select all that apply)",
        options: ["GET /api/invoices/:id", "PATCH /api/addresses/:id", "DELETE /api/orders/:id", "GET /health (public status check)"],
        correct: [0, 1, 2],
        explanation: "Jo bhi endpoint kisi **specific user ke object** ko padhta, badalta ya delete karta hai, use ownership check chahiye — read aur write dono. \`/health\` public hai, kisi user ka data nahi.",
        tags: ["coverage"],
      },
      {
        type: "SPOT_BUG",
        difficulty: 2,
        prompt: "This route requires login. What is the security bug?",
        code: `app.get("/api/invoices/:id", requireAuth, async (req, res) => {
  const invoice = await db.invoice.findUnique({
    where: { id: req.params.id },
  });
  if (!invoice) return res.status(404).json({ error: "Not found" });
  res.json(invoice);
});`,
        codeLanguage: "javascript",
        options: [
          "requireAuth should come after the handler",
          "The query does not check that the invoice belongs to req.user, so any logged-in user can read any invoice (IDOR); filter by id AND userId/tenantId from the token",
          "findUnique cannot be used with ids",
          "It should return 500 instead of 404",
        ],
        correct: [1],
        explanation: "Login check hai, **ownership check nahi**. Fix: \`findFirst({ where: { id: req.params.id, userId: req.user.id } })\`. Saath mein \`res.json(invoice)\` poora DB object bhej raha hai — DTO se sirf safe fields bhejo.",
        tags: ["idor", "security"],
      },
      {
        type: "SCENARIO",
        difficulty: 3,
        prompt: "A bug bounty hunter reports that changing the org id in GET /api/orgs/12/reports to /api/orgs/13/reports shows another company's reports. What is the right fix?",
        options: [
          "Hide the org id from the URL using base64",
          "On every request, check that req.user is a member of the org in the URL (membership from the database/token, not the URL), scope all report queries by that tenant, return 404 otherwise, and add cross-tenant tests",
          "Block the researcher's IP address",
          "Rate-limit the reports endpoint to 1 request per minute",
        ],
        correct: [1],
        explanation: "Tenant id URL mein ho sakta hai, par **membership server pe verify** honi chahiye aur har query tenant se scope. Base64 encoding chhupata nahi, IP block ya rate limit bug ko theek nahi karte. Tests se regression rukta hai.",
        tags: ["multi-tenant"],
      },
      {
        type: "ORDER_STEPS",
        difficulty: 2,
        prompt: "Order the steps of a secure GET /api/invoices/:id handler.",
        options: [
          "Authenticate the request and get user id and tenant id from the token",
          "Validate the :id parameter format",
          "Query the invoice with id AND owner/tenant filter (or load it and run the policy check)",
          "If nothing is found or the policy fails, return 404",
          "Return only the fields the user is allowed to see",
        ],
        explanation: "Pehle user kaun hai (token se), phir input validate, phir scoped query, fail pe 404, aur last mein safe DTO — internal fields kabhi nahi.",
        tags: ["secure-handler"],
      },
      {
        type: "EXPLAIN",
        difficulty: 2,
        prompt: "Why is making ids hard to guess (UUIDs, hashing) not a real fix for IDOR?",
        keywords: ["authorization", "server-side check", "leak", "obscurity", "every request"],
        explanation: "Hard-to-guess ids sirf obscurity hain — ids links, logs, emails, doosre API responses se leak ho jaati hain. Asli suraksha har request pe server-side authorization check hai ki ye object is user/tenant ka hai.",
        tags: ["security"],
      },
    ],
    buildTask: {
      title: "canAccess(user, resource) — the ownership policy",
      description: `Har secure API ke peeche ek policy function hota hai. Likho \`canAccess(user, resource)\` jo \`true\`/\`false\` return kare:

1. Agar \`user.tenantId\` aur \`resource.tenantId\` **alag** hain → \`false\` (doosri company ka data kabhi nahi, admin ko bhi nahi).
2. Agar \`user.role === "admin"\` → \`true\`.
3. Agar \`user.id === resource.ownerId\` → \`true\`.
4. Baaki sab → \`false\`.

\`user\`: \`{ id, role, tenantId }\`, \`resource\`: \`{ id, ownerId, tenantId }\`. Comparison strict rakho (type bhi match ho).`,
      functionName: "canAccess",
      starterJs: `function canAccess(user, resource) {
  // tenant check first, then admin, then owner
  return false;
}
`,
      starterPython: `def canAccess(user, resource):
    # tenant check first, then admin, then owner
    return False
`,
      tests: [
        { name: "owner can access", args: [{ id: 7, role: "user", tenantId: "acme" }, { id: 1001, ownerId: 7, tenantId: "acme" }], expected: true },
        { name: "other user cannot", args: [{ id: 7, role: "user", tenantId: "acme" }, { id: 1002, ownerId: 9, tenantId: "acme" }], expected: false },
        { name: "admin of same tenant can", args: [{ id: 1, role: "admin", tenantId: "acme" }, { id: 1002, ownerId: 9, tenantId: "acme" }], expected: true },
        { name: "admin of other tenant cannot", args: [{ id: 30, role: "admin", tenantId: "globex" }, { id: 1002, ownerId: 9, tenantId: "acme" }], expected: false },
        { name: "support role is not admin", args: [{ id: 5, role: "support", tenantId: "acme" }, { id: 1002, ownerId: 9, tenantId: "acme" }], expected: false },
        { name: "same user id but different tenant", args: [{ id: 7, role: "user", tenantId: "globex" }, { id: 1001, ownerId: 7, tenantId: "acme" }], expected: false, hidden: true },
        { name: "string id does not equal number id", args: [{ id: "7", role: "user", tenantId: "acme" }, { id: 1001, ownerId: 7, tenantId: "acme" }], expected: false, hidden: true },
      ],
      hints: [
        "Authorization ke rules ka **order** matter karta hai. Sabse strong rule (tenant boundary) sabse pehle — wo admin pe bhi lagta hai.",
        "Teen checks: tenant alag → false; admin → true; owner → true; warna false. Strict equality use karo (=== in JS, == in Python strings/ints ke liye already type-strict hai).",
        "JS: if (user.tenantId !== resource.tenantId) return false; if (user.role === \"admin\") return true; return user.id === resource.ownerId;",
      ],
      explainQuestions: [
        { question: "Why is the tenant check done before the admin check?", keywords: ["tenant boundary", "admin", "other company", "first"] },
        { question: "Where should user.id and user.tenantId come from in a real API, and why not from the request body? (security)", keywords: ["token", "session", "server", "attacker controls body"] },
        { question: "Why did you use strict comparison for ids, and what bug could loose comparison cause?", keywords: ["strict", "type", "string", "number"] },
      ],
      estMinutes: 15,
    },
    interview: [
      {
        question: "What is IDOR and how do you prevent it?",
        short: "IDOR, or Broken Object Level Authorization, is when an API uses a client-supplied id to access an object without checking that the authenticated user may access it. I prevent it by enforcing ownership and tenant scoping on every read and write — ideally inside the query using the user id from the session — centralising policies, returning 404 for objects the user cannot see, and testing cross-user access.",
        deep: `- **Cause**: \`SELECT ... WHERE id = :id\` with no user/tenant condition; or trusting \`userId\` from the body.
- **Prevention**:
  - Scope queries: \`WHERE id = $1 AND user_id = $2\`, with \`$2\` from the token.
  - Central policies (\`canAccess\`) or a scoped repository layer so developers cannot forget.
  - Multi-tenant: tenant id from the session; consider Postgres row-level security as defence in depth.
  - Apply to every verb (GET, PATCH, DELETE) and nested resources.
  - Return only allowed fields (DTOs).
- **Detection**: automated tests with two users and two tenants; monitor sequential-id 404 bursts.
- UUIDs reduce guessability but are not authorization.`,
        followUps: ["How would you test for IDOR automatically?", "403 or 404 — which do you return and why?", "How does row-level security help?"],
        commonMistake: "Answering 'use UUIDs' or 'require login' as the fix.",
        keywords: ["object level authorization", "ownership", "tenant scoping", "server-side", "tests"],
        difficulty: 2,
        roles: ["BACKEND", "FULLSTACK"],
      },
      {
        question: "What is the difference between authentication and authorization?",
        short: "Authentication verifies who the user is — for example by checking a password or a JWT. Authorization decides what that authenticated user is allowed to do on a specific resource, using roles, ownership and tenant rules. A request can pass authentication and still fail authorization, which is exactly what IDOR checks miss.",
        deep: `- **AuthN** answers "who are you?" — login, sessions, JWT, OAuth. Failure → 401.
- **AuthZ** answers "can you do this to this object?" — RBAC (roles), ABAC (attributes like owner, tenant, time), ownership checks. Failure → 403 (or 404 to hide existence).
- Both run on every request: middleware for authN; route/service/policy layer for authZ because it needs the specific resource.
- Common gaps: function-level (normal user calling an admin endpoint) and object-level (IDOR).`,
        followUps: ["What is RBAC vs ABAC?", "Where in the code should authorization logic live?"],
        commonMistake: "Using the words interchangeably or assuming a valid token implies permission.",
        keywords: ["who you are", "what you can do", "401", "403", "roles"],
        difficulty: 1,
        roles: ["BACKEND", "FULLSTACK", "SDE"],
      },
      {
        question: "How do you prevent cross-tenant data leaks in a multi-tenant application?",
        short: "Every tenant-owned row carries a tenant id, the tenant is derived from the authenticated session rather than the request, and every query is automatically scoped by that tenant through a repository layer, ORM middleware or database row-level security. I add cross-tenant tests and also scope caches, files and background jobs by tenant.",
        deep: `- Data model: \`tenant_id\` on every tenant-owned table, included in unique constraints and indexes (\`(tenant_id, id)\`).
- Request context: \`req.user.tenantId\` from the token; if the URL contains an org id, verify membership.
- Enforcement layers: scoped repositories, Prisma/SQLAlchemy query hooks, Postgres RLS with \`current_setting('app.tenant_id')\`.
- Don't forget: cache keys (\`report:{tenantId}:{id}\`), object storage paths, search indexes, exports, background jobs and logs.
- Tests: tenant A cannot read/update/delete tenant B's objects through any endpoint.`,
        followUps: ["How does Postgres row-level security work with connection pools?", "How would you scope Redis cache keys per tenant?"],
        commonMistake: "Scoping only the main SQL queries and forgetting caches, file storage and background jobs.",
        keywords: ["tenant id", "session", "scoped queries", "row-level security", "cache keys"],
        difficulty: 3,
        roles: ["BACKEND", "SDE"],
      },
    ],
    promptCard: {
      title: "Review my API for security issues",
      category: "SECURITY",
      task: "Get a structured security review of backend route code covering authentication, authorisation/tenant scoping (IDOR), input validation, injection and sensitive data exposure, with fixes.",
      whenToUse: "Before merging a new or changed API route, or when auditing existing endpoints that handle user or company data.",
      template: `You are a senior backend security reviewer. Review the following [FRAMEWORK] route code.

Context:
- How users are authenticated (e.g. JWT middleware, session): [AUTH_SETUP]
- Who should be allowed to access these routes and which data they own (ownership/tenant rules): [ACCESS_RULES]

Check the code for each of these categories:
1. Missing authentication (routes reachable without a logged-in user)
2. Missing authorisation or tenant scoping (IDOR / BOLA): objects fetched or changed by id without checking owner or tenant
3. Missing input validation (body, query, params; types, lengths, ranges, unknown fields)
4. Injection risks (SQL/NoSQL built with string concatenation, shell commands, unsafe raw queries)
5. Sensitive data in responses (password hashes, tokens, internal notes, other users' data, stack traces)

For each issue you find, give:
- the exact line (quote it),
- why it is dangerous, with a one-sentence example attack,
- a fixed version of the code.
If a category has no issues, say explicitly "No issues found in <category>". Do not invent problems that are not in the code.

Code:
[PASTE_CODE]`,
      variables: [
        { key: "FRAMEWORK", label: "e.g. Express + Prisma, FastAPI + SQLAlchemy" },
        { key: "AUTH_SETUP", label: "How req.user / current user is set" },
        { key: "ACCESS_RULES", label: "Who may access what (owner, admin, same tenant)" },
        { key: "PASTE_CODE", label: "The route handler code to review" },
      ],
      whyItWorks: [
        { part: "Senior backend security reviewer role", why: "Sets the bar to production security, not style comments." },
        { part: "Access rules as context", why: "The model cannot judge IDOR without knowing who should own what." },
        { part: "Five named categories", why: "Covers the most common API flaws systematically so none is skipped." },
        { part: "Line + attack + fix for each issue", why: "Makes every finding verifiable and immediately actionable." },
        { part: "Explicit 'no issues found' and no invented problems", why: "Shows which categories were really checked and reduces hallucinated findings." },
      ],
      verifyChecklist: [
        "Each reported line actually exists in your code",
        "Write a test where user B requests user A's object — it fails before the fix and passes after",
        "Run the fixed code: valid requests still work",
        "Confirm the fix takes user/tenant ids from the session, not the request",
        "Check categories marked 'no issues' yourself for at least one route",
      ],
      sampleOutput: `2. Authorisation / IDOR — ISSUE
Line: \`const invoice = await db.invoice.findUnique({ where: { id: req.params.id } })\`
Why: any logged-in user can read any invoice; e.g. user 7 requests /api/invoices/1002 and gets user 9's billing address.
Fix:
  const invoice = await db.invoice.findFirst({ where: { id: req.params.id, userId: req.user.id, tenantId: req.user.tenantId } });
  if (!invoice) return res.status(404).json({ error: "Not found" });

4. Injection — No issues found in injection (Prisma parameterises queries).
5. Sensitive data — ISSUE: res.json(invoice) returns internalNote; return { id, amount, status } only.`,
    },
  },
];
