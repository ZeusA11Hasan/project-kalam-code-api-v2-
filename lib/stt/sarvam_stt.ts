export interface SarvamSTTResponse {
  transcript: string
  language_code: string
}

// ============================================================
// PRODUCTION-READY: Complete Python Tamil Transliteration Map
// Covers: Keywords, Built-ins, OOP, DSA, Libraries, Errors
// ============================================================
const transliterationMap: Record<string, string> = {
  // ── CORE PYTHON KEYWORDS ──────────────────────────────
  பைதான்: "Python",
  பைத்தான்: "Python",
  ஃபார்: "for",
  வைல்: "while",
  இஃப்: "if",
  எல்ஸ்: "else",
  எலிஃப்: "elif",
  ப்ரேக்: "break",
  கன்டினியூ: "continue",
  பாஸ்: "pass",
  ரிட்டர்ன்: "return",
  யீல்ட்: "yield",
  டிரை: "try",
  எக்செப்ட்: "except",
  ஃபைனலி: "finally",
  ரேஸ்: "raise",
  விட்: "with",
  அஸ்: "as",
  இம்போர்ட்: "import",
  ஃப்ரம்: "from",
  டெல்: "del",
  இன்: "in",
  நாட்: "not",
  அண்ட்: "and",
  ஆர்: "or",
  இஸ்: "is",
  லேம்ப்டா: "lambda",
  அசர்ட்: "assert",
  க்ளோபல்: "global",
  நான்லோக்கல்: "nonlocal",
  அசின்க்: "async",
  அவெய்ட்: "await",

  // ── FUNCTIONS & DEFINITIONS ───────────────────────────
  டெஃப்: "def",
  டீப்: "def",
  க்ளாஸ்: "class",
  கிளாஸ்: "class",
  லேம்டா: "lambda",
  பங்க்ஷன்: "function",
  பங்க்ஷன்ஸ்: "functions",
  மெத்தட்: "method",
  மெத்தட்ஸ்: "methods",
  அர்குமெண்ட்: "argument",
  அர்குமெண்ட்ஸ்: "arguments",
  பாராமீட்டர்: "parameter",
  பாராமீட்டர்ஸ்: "parameters",
  ரிக்கர்ஷன்: "recursion",
  ரிக்கர்சிவ்: "recursive",
  டெக்கரேட்டர்: "decorator",
  டெக்கரேட்டர்ஸ்: "decorators",
  "ரிட்டர்ன் வேல்யூ": "return value",
  செல்ஃப்: "self",
  க்ளோஷர்: "closure",
  ஸ்கோப்: "scope",
  லோக்கல்: "local",
  "க்ளோபல் ஸ்கோப்": "global scope",

  // ── VARIABLES & DATA TYPES ────────────────────────────
  வேரியபிள்: "variable",
  வேரியபிள்ஸ்: "variables",
  இன்ட்: "int",
  இன்டிஜர்: "integer",
  ஃப்ளோட்: "float",
  ஸ்ட்ரிங்: "string",
  ஸ்ட்ரிங்ஸ்: "strings",
  பூலியன்: "boolean",
  பூல்: "bool",
  நன்: "None",
  நோன்: "None",
  ட்ரூ: "True",
  ஃபால்ஸ்: "False",
  கேரக்டர்: "character",
  "டேட்டா டைப்": "data type",
  "டேட்டா டைப்ஸ்": "data types",
  டைப்: "type",
  டைப்கேஸ்டிங்: "typecasting",
  கான்ஸ்டன்ட்: "constant",

  // ── INPUT / OUTPUT ────────────────────────────────────
  பிரின்ட்: "print",
  இன்புட்: "input",
  அவுட்புட்: "output",
  "எஃப் ஸ்ட்ரிங்": "f-string",
  ஃபார்மேட்: "format",
  என்கோட்: "encode",
  டிகோட்: "decode",

  // ── DATA STRUCTURES ───────────────────────────────────
  லிஸ்ட்: "list",
  லிஸ்ட்ஸ்: "lists",
  டூப்பிள்: "tuple",
  டூப்பிள்ஸ்: "tuples",
  டிக்ஷனரி: "dictionary",
  டிக்ஷனரீஸ்: "dictionaries",
  டிக்ட்: "dict",
  செட்: "set",
  செட்ஸ்: "sets",
  "ஃப்ரோஸன் செட்": "frozenset",
  ஆரே: "array",
  ஆரேஸ்: "arrays",
  ஸ்டாக்: "stack",
  க்யூ: "queue",
  "லிங்க்ட் லிஸ்ட்": "linked list",
  "ஹேஷ் மேப்": "hashmap",
  "ஹேஷ் டேபிள்": "hash table",
  இண்டெக்ஸ்: "index",
  இண்டெக்சிங்: "indexing",
  ஸ்லைஸிங்: "slicing",
  ஸ்லைஸ்: "slice",
  நெஸ்டெட்: "nested",
  "நெஸ்டெட் லிஸ்ட்": "nested list",
  அப்பெண்ட்: "append",
  எக்ஸ்டெண்ட்: "extend",
  இன்சர்ட்: "insert",
  ரிமூவ்: "remove",
  பாப்: "pop",
  கீஸ்: "keys",
  வேல்யூஸ்: "values",
  ஐட்டம்ஸ்: "items",
  சார்ட்: "sort",
  சார்டெட்: "sorted",
  ரிவர்ஸ்: "reverse",

  // ── LOOPS & ITERATION ─────────────────────────────────
  லூப்: "loop",
  லூப்ஸ்: "loops",
  லூப்பிங்: "looping",
  "ஃபார் லூப்": "for loop",
  "வைல் லூப்": "while loop",
  "நெஸ்டெட் லூப்": "nested loop",
  இட்டரேஷன்: "iteration",
  இட்டரேட்: "iterate",
  இட்டரேட்டர்: "iterator",
  ரேஞ்ச்: "range",
  எனுமரேட்: "enumerate",
  ஜிப்: "zip",
  மேப்: "map",
  ஃபில்டர்: "filter",
  ரிட்யூஸ்: "reduce",
  "லிஸ்ட் கம்ப்ரிஹென்ஷன்": "list comprehension",
  கம்ப்ரிஹென்ஷன்: "comprehension",

  // ── OOP CONCEPTS ──────────────────────────────────────
  ஆப்ஜெக்ட்: "object",
  ஆப்ஜெக்ட்ஸ்: "objects",
  இன்ஸ்டன்ஸ்: "instance",
  இன்ஹெரிட்டன்ஸ்: "inheritance",
  இன்ஹெரிட்: "inherit",
  பாலிமார்பிஸம்: "polymorphism",
  என்கேப்சுலேஷன்: "encapsulation",
  அப்ஸ்ட்ராக்ஷன்: "abstraction",
  அப்ஸ்ட்ராக்ட்: "abstract",
  சூப்பர்: "super",
  "பேஸ் கிளாஸ்": "base class",
  "சைல்ட் கிளாஸ்": "child class",
  "பேரெண்ட் கிளாஸ்": "parent class",
  இனிட்: "__init__",
  கன்ஸ்ட்ரக்டர்: "constructor",
  டெஸ்ட்ரக்டர்: "destructor",
  அட்ரிப்யூட்: "attribute",
  அட்ரிப்யூட்ஸ்: "attributes",
  "மேஜிக் மெத்தட்": "magic method",
  டண்டர்: "dunder",
  ஓவர்ரைடிங்: "overriding",
  ஓவர்லோடிங்: "overloading",

  // ── ERROR HANDLING ────────────────────────────────────
  எக்செப்ஷன்: "exception",
  எர்ரர்: "error",
  எர்ரர்ஸ்: "errors",
  "சின்டேக்ஸ் எர்ரர்": "SyntaxError",
  "டைப் எர்ரர்": "TypeError",
  "நேம் எர்ரர்": "NameError",
  "வேல்யூ எர்ரர்": "ValueError",
  "இண்டெக்ஸ் எர்ரர்": "IndexError",
  "கீ எர்ரர்": "KeyError",
  "அட்ரிப்யூட் எர்ரர்": "AttributeError",
  "இம்போர்ட் எர்ரர்": "ImportError",
  "ஜீரோ டிவிஷன் எர்ரர்": "ZeroDivisionError",
  "ஃபைல் நாட் ஃபவுண்ட்": "FileNotFoundError",
  "ரன்டைம் எர்ரர்": "RuntimeError",
  "ஸ்டாப் இட்டரேஷன்": "StopIteration",
  டிபக்கிங்: "debugging",
  டிபக்: "debug",
  லாக்கிங்: "logging",

  // ── FILE HANDLING ─────────────────────────────────────
  ஃபைல்: "file",
  ஃபைல்ஸ்: "files",
  "ஃபைல் ஹேண்ட்லிங்": "file handling",
  ஓபன்: "open",
  ரீட்: "read",
  ரைட்: "write",
  "அப்பெண்ட் மோட்": "append mode",
  க்லோஸ்: "close",
  "விட் ஸ்டேட்மெண்ட்": "with statement",

  // ── MODULES & LIBRARIES ───────────────────────────────
  மாட்யூல்: "module",
  மாட்யூல்ஸ்: "modules",
  லைப்ரரி: "library",
  லைப்ரரீஸ்: "libraries",
  பேக்கேஜ்: "package",
  பிப்: "pip",
  நம்பை: "NumPy",
  பாண்டாஸ்: "Pandas",
  மேட்ப்ளாட்லிப்: "Matplotlib",
  ரிக்வெஸ்ட்ஸ்: "requests",
  ஓஸ்: "os",
  சிஸ்: "sys",
  மேத்: "math",
  ரேண்டம்: "random",
  டேட்டைம்: "datetime",
  "ரீ மாட்யூல்": "re module",
  ஜேசன்: "JSON",
  "ஜே சன்": "JSON",

  // ── ALGORITHMS & DSA ──────────────────────────────────
  அல்காரிதம்: "algorithm",
  அல்காரிதம்ஸ்: "algorithms",
  சார்ட்டிங்: "sorting",
  சர்ச்சிங்: "searching",
  "பைனரி சர்ச்": "binary search",
  "லீனியர் சர்ச்": "linear search",
  "பப்பிள் சார்ட்": "bubble sort",
  "மேர்ஜ் சார்ட்": "merge sort",
  "க்விக் சார்ட்": "quick sort",
  "இன்சர்ஷன் சார்ட்": "insertion sort",
  "டைம் காம்ப்லெக்சிடி": "time complexity",
  "ஸ்பேஸ் காம்ப்லெக்சிடி": "space complexity",
  "பிக் ஓ": "Big O",
  ட்ரீ: "tree",
  க்ராஃப்: "graph",
  நோட்: "node",
  எட்ஜ்: "edge",
  ரூட்: "root",
  லீஃப்: "leaf",
  "பைனரி ட்ரீ": "binary tree",

  // ── GENERAL PROGRAMMING ───────────────────────────────
  கோட்: "code",
  கோடிங்: "coding",
  ப்ரோக்ராம்: "program",
  ப்ரோக்ராமிங்: "programming",
  சின்டேக்ஸ்: "syntax",
  லாஜிக்: "logic",
  அவுட்புட்: "output",
  கம்பைல்: "compile",
  ரன்: "run",
  எக்சிக்யூட்: "execute",
  டெர்மினல்: "terminal",
  கன்சோல்: "console",
  எடிட்டர்: "editor",
  ஐடிஇ: "IDE",
  கிட்: "Git",
  கிட்ஹப்: "GitHub",
  கமெண்ட்: "comment",
  கமெண்ட்ஸ்: "comments",
  டேட்டா: "data",
  டேட்டாபேஸ்: "database",
  ஏபிஐ: "API",
  ஃபங்ஷனல்: "functional",
  லாஜிக்கல்: "logical",
  ஆபரேட்டர்: "operator",
  ஆபரேட்டர்ஸ்: "operators",
  கண்டிஷன்: "condition",
  கண்டிஷனல்: "conditional",
  இன்டென்டேஷன்: "indentation",
  இன்டெண்ட்: "indent",
  "ரிகர்சிவ் ஃபங்க்ஷன்": "recursive function",
  ஸ்டேட்மெண்ட்: "statement",
  எக்ஸ்பிரஷன்: "expression",
  வேல்யூ: "value",
  வேல்யூஸ்: "values",
  கே: "key",
  அசைன்மெண்ட்: "assignment",
  கேரட்: "caret",
  மாட்யூலஸ்: "modulus"
}

// ============================================================
// Smart Transliteration — longest match first to avoid
// partial replacements (e.g. "இன்ட்" inside "இன்டிஜர்")
// ============================================================
export function fixTransliteration(text: string): string {
  // Sort by length descending — match longer phrases first
  const sortedEntries = Object.entries(transliterationMap).sort(
    ([a], [b]) => b.length - a.length
  )

  let fixed = text
  for (const [tamil, english] of sortedEntries) {
    fixed = fixed.replaceAll(tamil, english)
  }
  return fixed
}

export async function transcribeAudio(
  audioFile: File | Blob
): Promise<SarvamSTTResponse> {
  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) {
    throw new Error("SARVAM_API_KEY is not defined in environment variables")
  }

  const formData = new FormData()
  formData.append("file", audioFile, "audio.webm")
  formData.append("model", "saarika:v2.5")
  formData.append("language_code", "unknown") // Auto-detect Tamil/English
  formData.append("with_timestamps", "false")
  formData.append("with_disfluencies", "false")

  try {
    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Sarvam STT failed: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    const data = (await response.json()) as SarvamSTTResponse

    // Post-process: fix Tamil-script Python keywords → English
    data.transcript = fixTransliteration(data.transcript)

    return data
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unknown error occurred during Sarvam STT transcription")
  }
}
