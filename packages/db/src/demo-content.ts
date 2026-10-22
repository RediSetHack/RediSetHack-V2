// Dev/test demo content: one extra Region with learning modules (Stages), quizzes (Quests),
// graded coding activities, artifact-only CTFs and 10 Side Quests. Seeded idempotently by seed-demo.ts.
// `solution` fields are never stored; they let verify-demo.ts prove every activity is passable via Piston.
import { createHash } from "node:crypto";

type Lang = "python" | "javascript" | "c" | "cpp" | "java";
type Check = { input: string; expected: string };

export const DEMO_REGION = { name: "Operation Firewall", slug: "operation-firewall", description: "Demo campaign for local testing.", storyIntro: "The relay is under siege. Learn the craft, then hunt the intruder." };
export const DEMO_ZONES = [
  { name: "Foundations", slug: "foundations" },
  { name: "Low-Level Craft", slug: "low-level-craft" },
  { name: "Defender's Handbook", slug: "defenders-handbook" },
];

type Q = [prompt: string, correct: string, ...wrong: string[]];
export const DEMO_STAGES: {
  slug: string; title: string; zone: number; difficulty: "beginner" | "intermediate" | "advanced"; xp: number;
  competencies: string[]; lesson: { type: string; [k: string]: unknown }[]; quiz: Q[];
}[] = [
  {
    slug: "python-basics", title: "Python Basics", zone: 0, difficulty: "beginner", xp: 20, competencies: ["programming.fundamentals"],
    lesson: [
      { type: "text", content: "Python reads top to bottom. `input()` reads a line from stdin and `print()` writes to stdout; every Codelab exercise is graded on exactly that." },
      { type: "code", language: "python", content: "a, b = map(int, input().split())\nprint(a + b)" },
      { type: "text", content: "`split()` cuts a string on whitespace and `map(int, ...)` converts each piece to a number." },
    ],
    quiz: [
      ["Which function reads a line from standard input in Python?", "input()", "scan()", "read_line()"],
      ["What does `'a b'.split()` return?", "['a', 'b']", "'ab'", "('a', 'b')"],
      ["What is the type of `input()`'s result?", "str", "int", "bytes"],
    ],
  },
  {
    slug: "loops-and-logic", title: "Loops and Logic", zone: 0, difficulty: "beginner", xp: 20, competencies: ["programming.control-flow"],
    lesson: [
      { type: "text", content: "Loops repeat work and conditions choose a branch. Together they cover most beginner problems." },
      { type: "code", language: "python", content: "for i in range(1, 6):\n    print('even' if i % 2 == 0 else 'odd')" },
      { type: "text", content: "`%` is the remainder operator; `n % 3 == 0` is the classic divisibility test." },
    ],
    quiz: [
      ["What does `range(3)` produce?", "0, 1, 2", "1, 2, 3", "0, 1, 2, 3"],
      ["What is `10 % 3`?", "1", "3", "0"],
      ["Which keyword ends a loop early?", "break", "stop", "exit"],
    ],
  },
  {
    slug: "javascript-essentials", title: "JavaScript Essentials", zone: 0, difficulty: "beginner", xp: 25, competencies: ["programming.fundamentals", "programming.data-structures"],
    lesson: [
      { type: "text", content: "In the Codelab, JavaScript runs on Node. Read all of stdin with `fs.readFileSync(0, 'utf8')`." },
      { type: "code", language: "javascript", content: "const input = require('fs').readFileSync(0, 'utf8').trim();\nconsole.log(input.split(/\\s+/).length);" },
    ],
    quiz: [
      ["Which declares a block-scoped constant?", "const", "var", "def"],
      ["What does `[1,2,3].length` return?", "3", "2", "undefined"],
      ["Which prints to stdout in Node?", "console.log", "System.out", "echo"],
    ],
  },
  {
    slug: "c-and-cpp-basics", title: "C and C++ Basics", zone: 1, difficulty: "intermediate", xp: 30, competencies: ["programming.fundamentals"],
    lesson: [
      { type: "text", content: "C and C++ are compiled: a compile error fails the run before any test executes. Read compiler output carefully." },
      { type: "code", language: "c", content: "#include <stdio.h>\nint main(void) {\n    int n;\n    scanf(\"%d\", &n);\n    printf(\"%d\\n\", n * 2);\n    return 0;\n}" },
      { type: "text", content: "`scanf` needs the *address* of the variable (`&n`) because it writes into it." },
    ],
    quiz: [
      ["Which header declares printf?", "stdio.h", "string.h", "math.h"],
      ["What does `&n` give you?", "The address of n", "The value of n", "The size of n"],
      ["What happens on a compile error in the Codelab?", "The run fails before tests execute", "Tests run anyway", "The code is skipped silently"],
    ],
  },
  {
    slug: "java-basics", title: "Java Basics", zone: 1, difficulty: "intermediate", xp: 30, competencies: ["programming.fundamentals"],
    lesson: [
      { type: "text", content: "Java programs start in `public static void main`. Use `Scanner` to read stdin." },
      { type: "code", language: "java", content: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        System.out.println(in.nextInt() * 2);\n    }\n}" },
    ],
    quiz: [
      ["Which class reads typed input in Java?", "Scanner", "Reader3", "Console2"],
      ["What is the entry-point method named?", "main", "start", "run"],
      ["Is Java statically typed?", "Yes", "No", "Only for ints"],
    ],
  },
  {
    slug: "secure-input-handling", title: "Secure Input Handling", zone: 2, difficulty: "intermediate", xp: 35, competencies: ["security.input-validation", "security.secure-coding"],
    lesson: [
      { type: "text", content: "Treat every input as hostile until proven otherwise. Prefer an *allowlist* (describe what is valid) over a denylist (try to list what is bad)." },
      { type: "code", language: "python", content: "import re\nname = input()\nprint('valid' if re.fullmatch(r'[a-z0-9_]{3,16}', name) else 'invalid')" },
      { type: "text", content: "`re.fullmatch` must match the *whole* string; `re.match` would accept trailing junk." },
    ],
    quiz: [
      ["Which validation strategy is safer?", "Allowlist", "Denylist", "Trust the client"],
      ["Where must validation be enforced?", "On the server", "Only in the browser", "Nowhere"],
      ["`re.fullmatch` differs from `re.match` because it...", "Requires the whole string to match", "Ignores case", "Is faster"],
    ],
  },
  {
    slug: "encoding-is-not-encryption", title: "Encoding Is Not Encryption", zone: 2, difficulty: "beginner", xp: 25, competencies: ["security.secure-coding"],
    lesson: [
      { type: "text", content: "Base64, hex and ROT13 are *encodings*: reversible by anyone, with no key. They hide nothing from an investigator." },
      { type: "code", language: "python", content: "import base64\nprint(base64.b64decode('aGVsbG8=').decode())  # hello" },
      { type: "text", content: "Encryption needs a secret key. If you can undo it without one, it was only encoding." },
    ],
    quiz: [
      ["Does Base64 require a secret key to decode?", "No", "Yes", "Only for long strings"],
      ["Which of these is real encryption?", "AES with a secret key", "Base64", "ROT13"],
      ["ROT13 applied twice gives...", "The original text", "Garbage", "An error"],
    ],
  },
  {
    slug: "reading-logs", title: "Reading Logs Like a Defender", zone: 2, difficulty: "intermediate", xp: 30, competencies: ["security.authentication", "programming.data-structures"],
    lesson: [
      { type: "text", content: "Logs are an investigator's first source. Look for repeated failures from one source, odd hours, and fields that look encoded." },
      { type: "code", language: "text", content: "08:00:01 FAIL login user=admin ip=10.0.0.9\n08:00:02 FAIL login user=admin ip=10.0.0.9\n08:00:03 OK   login user=ana   ip=10.0.0.4" },
      { type: "text", content: "Many failures from one IP in seconds is a brute-force signal." },
    ],
    quiz: [
      ["Many failed logins from one IP in seconds suggests...", "Brute force", "A healthy system", "A DNS outage"],
      ["Which tool counts matching lines fastest?", "grep -c", "mkdir", "chmod"],
      ["Should secrets be written to logs?", "Never", "Always", "Only on errors"],
    ],
  },
];

export const DEMO_CODING: {
  id: string; stage: string; title: string; language: Lang; prompt: string; starter: string; difficulty: "beginner" | "intermediate";
  competencies: string[]; examples: Check[]; hidden: Check[]; xp: number; solution: string;
}[] = [
  {
    id: "demo-py-sum", stage: "python-basics", title: "Add two numbers", language: "python", difficulty: "beginner", competencies: ["programming.fundamentals"], xp: 10,
    prompt: "Read two integers on one line and print their sum.", starter: "a, b = map(int, input().split())\n",
    examples: [{ input: "3 4", expected: "7" }], hidden: [{ input: "-5 5", expected: "0" }, { input: "100 250", expected: "350" }],
    solution: "a, b = map(int, input().split())\nprint(a + b)\n",
  },
  {
    id: "demo-py-reverse", stage: "python-basics", title: "Reverse the message", language: "python", difficulty: "beginner", competencies: ["programming.fundamentals"], xp: 10,
    prompt: "Read a line and print it reversed.", starter: "s = input()\n",
    examples: [{ input: "abc", expected: "cba" }], hidden: [{ input: "relay", expected: "yaler" }, { input: "a", expected: "a" }],
    solution: "print(input()[::-1])\n",
  },
  {
    id: "demo-py-fizzbuzz", stage: "loops-and-logic", title: "FizzBuzz line", language: "python", difficulty: "beginner", competencies: ["programming.control-flow"], xp: 15,
    prompt: "Read n. Print `FizzBuzz` if divisible by 3 and 5, `Fizz` if by 3, `Buzz` if by 5, otherwise n.", starter: "n = int(input())\n",
    examples: [{ input: "9", expected: "Fizz" }, { input: "7", expected: "7" }], hidden: [{ input: "15", expected: "FizzBuzz" }, { input: "10", expected: "Buzz" }],
    solution: "n = int(input())\nprint('FizzBuzz' if n % 15 == 0 else 'Fizz' if n % 3 == 0 else 'Buzz' if n % 5 == 0 else n)\n",
  },
  {
    id: "demo-py-palindrome", stage: "loops-and-logic", title: "Palindrome check", language: "python", difficulty: "beginner", competencies: ["programming.control-flow"], xp: 15,
    prompt: "Print `yes` if the line reads the same backwards, otherwise `no`.", starter: "s = input()\n",
    examples: [{ input: "level", expected: "yes" }, { input: "abc", expected: "no" }], hidden: [{ input: "racecar", expected: "yes" }, { input: "ab", expected: "no" }],
    solution: "s = input()\nprint('yes' if s == s[::-1] else 'no')\n",
  },
  {
    id: "demo-py-username", stage: "secure-input-handling", title: "Allowlist the username", language: "python", difficulty: "intermediate", competencies: ["security.input-validation"], xp: 20,
    prompt: "Print `valid` only if the username is 3-16 characters of lowercase letters, digits or underscore; otherwise `invalid`. Use an allowlist, not a denylist.", starter: "import re\nname = input()\n",
    examples: [{ input: "ana_01", expected: "valid" }, { input: "x", expected: "invalid" }], hidden: [{ input: "admin'--", expected: "invalid" }, { input: "UPPER", expected: "invalid" }, { input: "abc_def_ghi_jkl_mno", expected: "invalid" }],
    solution: "import re\nname = input()\nprint('valid' if re.fullmatch(r'[a-z0-9_]{3,16}', name) else 'invalid')\n",
  },
  {
    id: "demo-js-wordcount", stage: "javascript-essentials", title: "Count the words", language: "javascript", difficulty: "beginner", competencies: ["programming.data-structures"], xp: 10,
    prompt: "Read a line and print how many whitespace-separated words it has.", starter: "const input = require('fs').readFileSync(0, 'utf8').trim();\n",
    examples: [{ input: "hello brave world", expected: "3" }], hidden: [{ input: "one", expected: "1" }, { input: "a  b   c d", expected: "4" }],
    solution: "const input = require('fs').readFileSync(0, 'utf8').trim();\nconsole.log(input.split(/\\s+/).length);\n",
  },
  {
    id: "demo-js-max", stage: "javascript-essentials", title: "Largest signal", language: "javascript", difficulty: "beginner", competencies: ["programming.data-structures"], xp: 15,
    prompt: "Read space-separated integers and print the largest.", starter: "const nums = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n",
    examples: [{ input: "3 9 2", expected: "9" }], hidden: [{ input: "-4 -9 -1", expected: "-1" }, { input: "7", expected: "7" }],
    solution: "const nums = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(Math.max(...nums));\n",
  },
  {
    id: "demo-c-factorial", stage: "c-and-cpp-basics", title: "Factorial in C", language: "c", difficulty: "intermediate", competencies: ["programming.fundamentals"], xp: 20,
    prompt: "Read n (0 <= n <= 12) and print n!.", starter: "#include <stdio.h>\nint main(void) {\n    int n;\n    scanf(\"%d\", &n);\n    return 0;\n}\n",
    examples: [{ input: "5", expected: "120" }], hidden: [{ input: "0", expected: "1" }, { input: "12", expected: "479001600" }],
    solution: "#include <stdio.h>\nint main(void) {\n    int n; long r = 1;\n    scanf(\"%d\", &n);\n    for (int i = 2; i <= n; i++) r *= i;\n    printf(\"%ld\\n\", r);\n    return 0;\n}\n",
  },
  {
    id: "demo-cpp-digitsum", stage: "c-and-cpp-basics", title: "Digit sum in C++", language: "cpp", difficulty: "intermediate", competencies: ["programming.fundamentals"], xp: 20,
    prompt: "Read a non-negative integer and print the sum of its digits.", starter: "#include <iostream>\nint main() {\n    long n;\n    std::cin >> n;\n}\n",
    examples: [{ input: "123", expected: "6" }], hidden: [{ input: "0", expected: "0" }, { input: "99999", expected: "45" }],
    solution: "#include <iostream>\nint main() {\n    long n, s = 0;\n    std::cin >> n;\n    while (n > 0) { s += n % 10; n /= 10; }\n    std::cout << s << std::endl;\n}\n",
  },
  {
    id: "demo-java-fib", stage: "java-basics", title: "Fibonacci in Java", language: "java", difficulty: "intermediate", competencies: ["programming.fundamentals"], xp: 25,
    prompt: "Read n (0-40) and print the n-th Fibonacci number (F0=0, F1=1).", starter: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int n = in.nextInt();\n    }\n}\n",
    examples: [{ input: "10", expected: "55" }], hidden: [{ input: "0", expected: "0" }, { input: "1", expected: "1" }, { input: "40", expected: "102334155" }],
    solution: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int n = in.nextInt();\n        long a = 0, b = 1;\n        for (int i = 0; i < n; i++) { long t = a + b; a = b; b = t; }\n        System.out.println(a);\n    }\n}\n",
  },
];

const b64 = (s: string) => Buffer.from(s).toString("base64");
const hex = (s: string) => Buffer.from(s).toString("hex");
const shift = (s: string, k: number) => s.replace(/[a-z]/gi, (c) => { const base = c <= "Z" ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0) - base + k) % 26) + base); });
const log = (...lines: string[]) => lines.join("\n") + "\n";
const sha = (flag: string) => createHash("sha256").update(flag).digest("hex");

const ctf = (id: string, stage: string, title: string, category: string, difficulty: "beginner" | "intermediate", brief: string, artifactName: string, artifact: string, flag: string, xp: number) =>
  ({ id, stage, title, category, difficulty, brief: `${brief} Offline artifact only; the flag looks like RSH{...}.`, artifactName, artifact, flag, flagHash: sha(flag), xp });

export const DEMO_CTFS = [
  ctf("demo-ctf-base64", "encoding-is-not-encryption", "Base64 whisper", "crypto", "beginner", "A beacon field is base64 encoded.", "beacon.txt", log("seq=1 ok", `payload=${b64("RSH{base64_is_not_secret}")}`, "seq=3 ok"), "RSH{base64_is_not_secret}", 20),
  ctf("demo-ctf-hex", "encoding-is-not-encryption", "Hex dump", "crypto", "beginner", "Decode the hex string in the memo.", "memo.hex", `memo: ${hex("RSH{hex_is_just_bytes}")}\n`, "RSH{hex_is_just_bytes}", 20),
  ctf("demo-ctf-rot13", "encoding-is-not-encryption", "Rotated note", "crypto", "beginner", "A note was ROT13'd. Undo it.", "note.txt", `note: ${shift("RSH{two_times_is_not_secure}", 13)}\n`, "RSH{two_times_is_not_secure}", 20),
  ctf("demo-ctf-caesar", "encoding-is-not-encryption", "Caesar courier", "crypto", "beginner", "The courier shifted every letter forward by 3. Wrap the decoded text in RSH{}.", "courier.txt", `msg: ${shift("shift_back_three", 3)}\n`, "RSH{shift_back_three}", 25),
  ctf("demo-ctf-reverse", "python-basics", "Mirror mirror", "misc", "beginner", "The flag was written backwards.", "mirror.txt", `${"RSH{read_it_backwards}".split("").reverse().join("")}\n`, "RSH{read_it_backwards}", 15),
  ctf("demo-ctf-bruteforce", "reading-logs", "Spot the brute force", "forensics", "intermediate", "One IP failed many logins. The flag is RSH{<that ip with dots replaced by underscores>}.", "auth.log", log("08:00:01 FAIL user=admin ip=10.0.0.9", "08:00:02 FAIL user=admin ip=10.0.0.9", "08:00:03 OK   user=ana ip=10.0.0.4", "08:00:04 FAIL user=root ip=10.0.0.9", "08:00:05 FAIL user=admin ip=10.0.0.9", "08:00:09 OK   user=bo ip=10.0.0.7"), "RSH{10_0_0_9}", 30),
  ctf("demo-ctf-hiddenlog", "reading-logs", "Needle in the log", "forensics", "intermediate", "One DEBUG line leaks a secret in base64.", "app.log", log("INFO start", "INFO listening :8080", `DEBUG session_key=${b64("RSH{never_log_secrets}")}`, "INFO request /health 200"), "RSH{never_log_secrets}", 30),
  ctf("demo-ctf-cookie", "secure-input-handling", "Trusting the cookie", "web", "intermediate", "A session cookie is just base64 JSON. Find the field that should never be client-visible.", "cookie.txt", `session=${b64(JSON.stringify({ user: "ana", role: "member", flag: "RSH{never_trust_client_state}" }))}\n`, "RSH{never_trust_client_state}", 35),
  ctf("demo-ctf-urlenc", "secure-input-handling", "Percent-encoded probe", "web", "beginner", "A probe URL hides its flag with percent-encoding.", "probe.txt", `GET /search?q=${encodeURIComponent("RSH{decode_before_you_validate}")}\n`, "RSH{decode_before_you_validate}", 20),
  ctf("demo-ctf-comment", "javascript-essentials", "Comment left behind", "web", "beginner", "A developer left a secret in a page comment.", "page.html", `<html><body><h1>Welcome</h1>\n<!-- TODO remove: ${b64("RSH{comments_ship_to_prod}")} -->\n</body></html>\n`, "RSH{comments_ship_to_prod}", 20),
];

// 10 Side Quests: 5 point at CTFs, 5 at coding activities, with a mix of prerequisites.
export const DEMO_SIDE_QUESTS: {
  id: string; title: string; summary: string; type: "ctf" | "coding"; target: string; xp: number;
  prereq: { kind: "level"; level: number } | { kind: "after"; target: string; type: "ctf" | "coding" } | null;
}[] = [
  { id: "demo-sq-base64", title: "Decode the beacon", summary: "Recover a base64-hidden flag.", type: "ctf", target: "demo-ctf-base64", xp: 10, prereq: null },
  { id: "demo-sq-hex", title: "Read the hex memo", summary: "Turn hex back into text.", type: "ctf", target: "demo-ctf-hex", xp: 10, prereq: null },
  { id: "demo-sq-caesar", title: "Unshift the courier", summary: "Crack a Caesar shift.", type: "ctf", target: "demo-ctf-caesar", xp: 12, prereq: { kind: "after", target: "demo-ctf-base64", type: "ctf" } },
  { id: "demo-sq-bruteforce", title: "Name the attacker", summary: "Find the brute-forcing IP in an auth log.", type: "ctf", target: "demo-ctf-bruteforce", xp: 20, prereq: { kind: "level", level: 1 } },
  { id: "demo-sq-cookie", title: "Read the cookie jar", summary: "Inspect a client-side session cookie.", type: "ctf", target: "demo-ctf-cookie", xp: 25, prereq: { kind: "level", level: 2 } },
  { id: "demo-sq-sum", title: "Warm-up: add numbers", summary: "A tiny Python graded exercise.", type: "coding", target: "demo-py-sum", xp: 5, prereq: null },
  { id: "demo-sq-palindrome", title: "Mirror check", summary: "Palindromes in Python.", type: "coding", target: "demo-py-palindrome", xp: 10, prereq: { kind: "after", target: "demo-py-sum", type: "coding" } },
  { id: "demo-sq-username", title: "Guard the sign-up form", summary: "Allowlist usernames with a regex.", type: "coding", target: "demo-py-username", xp: 20, prereq: { kind: "level", level: 1 } },
  { id: "demo-sq-factorial", title: "Compile and conquer", summary: "Factorial in C, via Piston.", type: "coding", target: "demo-c-factorial", xp: 15, prereq: null },
  { id: "demo-sq-java", title: "Fibonacci in Java", summary: "Java through Piston.", type: "coding", target: "demo-java-fib", xp: 20, prereq: { kind: "level", level: 1 } },
];

export const DEMO_SIDE_QUEST_BRIEF = "Optional detour. Open the linked activity, solve it, and submit. The main story never waits on this.";
