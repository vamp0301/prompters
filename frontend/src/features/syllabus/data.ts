/**
 * One syllabus, four languages. Every language has exactly the same 16 modules in the same order;
 * each topic belongs to that language only (no cross-language topics inside a track).
 */
export type SyllabusLang = "python" | "javascript" | "java" | "cpp";

export const LANGS: { key: SyllabusLang; label: string; inPlatform: boolean }[] = [
  { key: "python", label: "Python", inPlatform: true },
  { key: "javascript", label: "JavaScript", inPlatform: true },
  { key: "java", label: "Java", inPlatform: false },
  { key: "cpp", label: "C++", inPlatform: false },
];

export interface SyllabusModule {
  n: number;
  title: string;
  goal: string;
  topics: Record<SyllabusLang, string[]>;
}

export const SYLLABUS: SyllabusModule[] = [
  {
    n: 1,
    title: "Getting started",
    goal: "Install the toolchain, run your first program and read errors.",
    topics: {
      python: ["Installing Python & the REPL", "Running .py files", "Indentation as syntax", "print() and input()", "Reading tracebacks"],
      javascript: ["Node.js & the browser console", "Running .js files with node", "Statements, semicolons and blocks", "console.log and prompt", "Reading stack traces"],
      java: ["JDK, JRE and the JVM", "javac and java: compile and run", "The class and main method", "System.out.println and Scanner", "Reading compiler errors and stack traces"],
      cpp: ["Compilers: g++ and clang++", "Compile, link and run", "#include and int main()", "std::cout and std::cin", "Reading compiler errors"],
    },
  },
  {
    n: 2,
    title: "Variables & data types",
    goal: "Store values and know what each type can hold.",
    topics: {
      python: ["Names and assignment", "int, float, bool, str, None", "Dynamic typing and type()", "Type conversion", "Constants by convention"],
      javascript: ["let, const and var", "number, bigint, string, boolean", "undefined vs null", "typeof and type coercion", "Explicit conversion"],
      java: ["Primitive types (int, long, double, char, boolean)", "Reference types and String", "var (local type inference)", "Casting and widening", "final constants"],
      cpp: ["Fundamental types and sizes", "auto and type deduction", "const and constexpr", "Implicit and explicit casts (static_cast)", "Integer overflow and limits"],
    },
  },
  {
    n: 3,
    title: "Operators & expressions",
    goal: "Compute, compare and combine values correctly.",
    topics: {
      python: ["Arithmetic, // and %", "Comparison and chained comparisons", "and, or, not and short-circuiting", "Identity (is) vs equality (==)", "Operator precedence"],
      javascript: ["Arithmetic and the % operator", "== vs ===", "&&, ||, ?? and short-circuiting", "Optional chaining ?.", "Operator precedence"],
      java: ["Arithmetic and integer division", "Comparison and == vs equals()", "&&, || and short-circuiting", "Increment/decrement and compound assignment", "Bitwise operators"],
      cpp: ["Arithmetic and integer division", "Comparison and logical operators", "Increment/decrement pitfalls", "Bitwise operators and shifts", "Operator precedence"],
    },
  },
  {
    n: 4,
    title: "Control flow",
    goal: "Make decisions and repeat work.",
    topics: {
      python: ["if / elif / else", "for loops and range()", "while loops", "break, continue and loop else", "match-case"],
      javascript: ["if / else and the ternary", "switch", "for, while and do-while", "for...of vs for...in", "break and continue, labels"],
      java: ["if / else and the ternary", "switch statements and switch expressions", "for, while and do-while", "Enhanced for loop", "break, continue and labels"],
      cpp: ["if / else and the ternary", "switch", "for, while and do-while", "Range-based for", "break and continue"],
    },
  },
  {
    n: 5,
    title: "Functions",
    goal: "Break programs into reusable, testable pieces.",
    topics: {
      python: ["def, parameters and return", "Default, keyword and *args/**kwargs", "Scope and the LEGB rule", "Lambdas", "Recursion"],
      javascript: ["Declarations vs expressions vs arrows", "Default and rest parameters", "Scope, hoisting and closures", "Higher-order functions and callbacks", "Recursion"],
      java: ["Methods: parameters and return types", "Method overloading", "Pass-by-value of references", "Static vs instance methods", "Recursion"],
      cpp: ["Declarations, definitions and headers", "Pass by value, reference and const reference", "Overloading and default arguments", "Lambdas and captures", "Recursion"],
    },
  },
  {
    n: 6,
    title: "Strings & text",
    goal: "Read, build and transform text safely.",
    topics: {
      python: ["Indexing and slicing", "String methods", "f-strings", "Immutability", "Unicode and encoding"],
      javascript: ["String methods", "Template literals", "Immutability", "Regular expressions", "Unicode and code points"],
      java: ["String immutability and the string pool", "StringBuilder", "Common String methods", "String.format and text blocks", "Regular expressions (Pattern, Matcher)"],
      cpp: ["std::string basics", "std::string_view", "C-strings vs std::string", "String streams", "Character handling"],
    },
  },
  {
    n: 7,
    title: "Built-in collections",
    goal: "Pick the right container and know its cost.",
    topics: {
      python: ["list", "tuple", "dict", "set", "Comprehensions"],
      javascript: ["Arrays and array methods (map, filter, reduce)", "Objects as records", "Map and Set", "Destructuring and spread", "Array sorting pitfalls"],
      java: ["Arrays", "The Collections Framework: List, Set, Map", "ArrayList vs LinkedList", "HashMap vs TreeMap", "Iterators and Collections utilities"],
      cpp: ["Arrays and std::array", "std::vector", "std::map vs std::unordered_map", "std::set and std::unordered_set", "Iterators"],
    },
  },
  {
    n: 8,
    title: "Object-oriented programming",
    goal: "Model data and behaviour with classes.",
    topics: {
      python: ["Classes and __init__", "Instance, class and static methods", "Inheritance and super()", "Dunder methods", "dataclasses"],
      javascript: ["Objects and this", "Prototypes and the prototype chain", "class syntax and inheritance", "Getters, setters and private #fields", "Composition over inheritance"],
      java: ["Classes, objects and constructors", "Encapsulation and access modifiers", "Inheritance, interfaces and abstract classes", "Polymorphism and overriding", "equals(), hashCode() and records"],
      cpp: ["Classes, constructors and destructors", "Access specifiers and encapsulation", "Inheritance and virtual functions", "Operator overloading", "Rule of three / five / zero"],
    },
  },
  {
    n: 9,
    title: "Errors & exceptions",
    goal: "Fail loudly, recover safely.",
    topics: {
      python: ["try / except / else / finally", "Raising exceptions", "Custom exception classes", "Context managers (with)", "EAFP vs LBYL"],
      javascript: ["try / catch / finally", "Throwing Error objects", "Custom error classes", "Errors in async code", "Defensive checks"],
      java: ["try / catch / finally", "Checked vs unchecked exceptions", "throws and custom exceptions", "try-with-resources", "Optional instead of null"],
      cpp: ["try / catch and throw", "Standard exception hierarchy", "noexcept", "RAII for safe cleanup", "Error codes vs exceptions"],
    },
  },
  {
    n: 10,
    title: "Modules, packages & tooling",
    goal: "Organise code and use the ecosystem.",
    topics: {
      python: ["import and modules", "Packages and __init__.py", "pip and virtual environments", "Standard library tour", "PEP 8 and formatting"],
      javascript: ["ES modules: import / export", "CommonJS vs ESM", "npm and package.json", "Linting and formatting", "Bundlers at a glance"],
      java: ["Packages and imports", "Maven / Gradle basics", "JAR files and the classpath", "Java modules (JPMS) overview", "Code style conventions"],
      cpp: ["Header and source files", "Include guards and #pragma once", "Namespaces", "CMake basics", "Linking libraries"],
    },
  },
  {
    n: 11,
    title: "Files & I/O",
    goal: "Read and write data from disk and streams.",
    topics: {
      python: ["open() and file modes", "Reading and writing text", "pathlib", "CSV and JSON", "Working with binary files"],
      javascript: ["fs (Node.js): read and write files", "Promises-based fs", "path utilities", "JSON parse and stringify", "Streams in Node.js"],
      java: ["java.nio.file: Files and Path", "Reading and writing text", "Buffered streams", "Serialization overview", "JSON with a library"],
      cpp: ["fstream: ifstream and ofstream", "Reading line by line", "std::filesystem", "Binary I/O", "Stream state and errors"],
    },
  },
  {
    n: 12,
    title: "Memory & the runtime",
    goal: "Understand what really happens when your code runs.",
    topics: {
      python: ["Everything is an object; references", "Mutable vs immutable", "Reference counting and garbage collection", "Shallow vs deep copy", "The GIL"],
      javascript: ["Call stack and heap", "Primitives vs references", "Garbage collection", "Execution context and hoisting", "Memory leaks"],
      java: ["The JVM: stack and heap", "Garbage collection", "Memory model basics", "String pool and immutability", "JIT compilation"],
      cpp: ["Stack vs heap", "Pointers and references", "new / delete and their dangers", "Smart pointers: unique_ptr, shared_ptr", "Undefined behaviour"],
    },
  },
  {
    n: 13,
    title: "Concurrency & async",
    goal: "Do more than one thing at a time, safely.",
    topics: {
      python: ["Threads and the GIL", "multiprocessing", "asyncio: async / await", "concurrent.futures", "Race conditions and locks"],
      javascript: ["The event loop", "Callbacks", "Promises", "async / await", "Microtasks vs macrotasks"],
      java: ["Threads and Runnable", "ExecutorService and thread pools", "synchronized and locks", "CompletableFuture", "Concurrent collections"],
      cpp: ["std::thread", "std::mutex and lock_guard", "std::atomic", "std::async and futures", "Data races"],
    },
  },
  {
    n: 14,
    title: "Functional & modern features",
    goal: "Write concise, expressive code the modern way.",
    topics: {
      python: ["Iterators and generators", "Decorators", "map, filter and functools", "Type hints", "itertools"],
      javascript: ["Iterators and generators", "Immutability patterns", "Closures in practice", "Optional chaining and nullish coalescing", "Symbols"],
      java: ["Lambdas and functional interfaces", "Streams API", "Method references", "Optional", "Generics"],
      cpp: ["Templates", "STL algorithms", "Move semantics", "Lambdas with algorithms", "Modern C++ (C++17/20) features"],
    },
  },
  {
    n: 15,
    title: "Testing & debugging",
    goal: "Prove your code works and fix it when it doesn't.",
    topics: {
      python: ["assert", "unittest", "pytest", "Debugging with pdb", "Logging"],
      javascript: ["Unit tests with a test runner", "Assertions and mocks", "Debugging in Node and the browser", "Testing async code", "Logging"],
      java: ["JUnit", "Assertions", "Mocking (Mockito) overview", "IDE debugging", "Logging"],
      cpp: ["assert", "Unit testing (GoogleTest) basics", "Debugging with gdb", "Sanitizers (ASan, UBSan)", "Logging"],
    },
  },
  {
    n: 16,
    title: "DSA & interview essentials",
    goal: "Use the language confidently in coding interviews.",
    topics: {
      python: ["Big-O of built-in operations", "collections: deque, Counter, defaultdict", "heapq and bisect", "Sorting with key functions", "Common Python interview pitfalls"],
      javascript: ["Big-O of array and object operations", "Map / Set for hashing problems", "Implementing a heap / queue", "Sorting with comparators", "Common JavaScript interview pitfalls"],
      java: ["Big-O of collection operations", "ArrayDeque and PriorityQueue", "Comparator and Comparable", "Arrays and Collections utilities", "Common Java interview pitfalls"],
      cpp: ["Big-O of STL operations", "std::priority_queue and std::deque", "Custom comparators", "Fast I/O for competitive programming", "Common C++ interview pitfalls"],
    },
  },
];

/**
 * Market signal: Stack Overflow Developer Survey 2026, "Programming, scripting, and markup languages",
 * all respondents. It measures what developers USE, not the number of job openings.
 */
export const MARKET = {
  source: "Stack Overflow Developer Survey 2026",
  url: "https://survey.stackoverflow.co/2026/technology",
  checked: "8 Oct 2026",
  usage: [
    { lang: "JavaScript", pct: 62.0, rank: 1 },
    { lang: "Python", pct: 58.0, rank: 4 },
    { lang: "Java", pct: 27.6, rank: 7 },
    { lang: "C++", pct: 24.3, rank: 10 },
  ],
};

/** Which first language fits which goal — the honest answer to "which is most in demand?". */
export const BY_GOAL: { goal: string; pick: string; why: string }[] = [
  { goal: "Full-stack / web developer", pick: "JavaScript → TypeScript", why: "Runs in every browser and on the server; the most-used language in the survey." },
  { goal: "Backend developer", pick: "Java or JavaScript (Node.js) or Python", why: "Java dominates large enterprise backends; Node.js and Python are common in startups." },
  { goal: "AI / ML / data", pick: "Python", why: "The ecosystem for data and machine learning is built around Python." },
  { goal: "DSA / competitive programming / systems", pick: "C++", why: "Fast, with the STL for algorithms; the usual choice for competitive programming and performance-critical systems." },
  { goal: "Large Indian IT services & enterprise roles", pick: "Java", why: "Widely used in enterprise and banking codebases and common in campus placement tests." },
];
