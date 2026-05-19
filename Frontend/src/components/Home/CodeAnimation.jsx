import { useEffect, useState } from "react";

const codeLines = [
  "use school_for_training::career::Mentorship;",
  "use school_for_training::learning::Courses;",
  "",
  "fn start_journey(student: &Student) {",
  "    let roadmap = Courses::full_stack();",
  "    student.learn(roadmap);",
  "    student.build_projects(12);",
  "    Mentorship::guide(student);",
  '    println!("Build Skills. Build Future.");',
  "}",
];

export default function CodeAnimation() {
  const [displayed, setDisplayed] = useState(codeLines.map(() => ""));

  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  // TYPING EFFECT
  useEffect(() => {
    if (lineIndex >= codeLines.length) return;

    const timeout = setTimeout(() => {
      const currentLine = codeLines[lineIndex];

      setDisplayed((prev) => {
        const updated = [...prev];

        updated[lineIndex] = currentLine.slice(0, charIndex + 1);

        return updated;
      });

      if (charIndex < currentLine.length - 1) {
        setCharIndex((prev) => prev + 1);
      } else {
        setLineIndex((prev) => prev + 1);
        setCharIndex(0);
      }
    }, 40);

    return () => clearTimeout(timeout);
  }, [charIndex, lineIndex]);

  // LOOP
  useEffect(() => {
    if (lineIndex === codeLines.length) {
      const timer = setTimeout(() => {
        setDisplayed(codeLines.map(() => ""));
        setLineIndex(0);
        setCharIndex(0);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lineIndex]);

  // CLEAN SYNTAX HIGHLIGHTER
  const highlight = (line) => {
    if (!line) return "";

    let formatted = line.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // STRINGS
    formatted = formatted.replace(
      /"([^"]*)"/g,
      '<span class="text-orange-500">"$1"</span>',
    );

    // KEYWORDS
    formatted = formatted.replace(
      /\b(use|fn|let)\b/g,
      '<span class="text-green-600 font-medium">$1</span>',
    );

    // MODULES / TYPES
    formatted = formatted.replace(
      /\b(Mentorship|Courses|Student)\b/g,
      '<span class="text-purple-600">$1</span>',
    );

    // FUNCTIONS
    formatted = formatted.replace(
      /\b([a-zA-Z0-9_]+)(?=\()/g,
      '<span class="text-blue-600">$1</span>',
    );

    return formatted;
  };

  return (
    <div className="w-full flex justify-center px-0 sm:px-4 bg-white min-w-0">
      {/* MAIN WINDOW */}
      <div className="w-full max-w-5xl rounded-[28px] border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            {/* DOTS */}
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
            </div>

            {/* FILE */}
            <div>
              <h3 className="text-base font-light text-gray-800">Sft.rs</h3>
            </div>
          </div>
        </div>

        {/* CODE AREA */}
        <div className="bg-white h-[320px] sm:h-[420px] overflow-hidden px-3 sm:px-6 py-4 sm:py-5">
          <div className="space-y-1 font-mono text-[12px] sm:text-[15px] leading-6 sm:leading-8">
            {displayed.map((line, i) => {
              const isActive = i === lineIndex;

              return (
                <div
                  key={i}
                  className={`flex items-center px-3 rounded-lg transition-all duration-300 ${
                    isActive ? "bg-gray-50" : "bg-transparent"
                  }`}
                >
                  {/* LINE NUMBER */}
                  <span className="w-7 sm:w-10 shrink-0 text-gray-400 select-none text-xs sm:text-sm">
                    {i <= lineIndex ? String(i + 1).padStart(2, "0") : ""}
                  </span>

                  {/* CODE */}
                  <div className="flex items-center flex-1 min-w-0">
                    <span
                      className="text-gray-800 whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{
                        __html: highlight(line),
                      }}
                    />

                    {/* CURSOR */}
                    {isActive && (
                      <span className="ml-[2px] text-black animate-pulse">
                        |
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
            <span>Rust</span>

            <span>•</span>

            <span>School For Training</span>
          </div>
        </div>
      </div>
    </div>
  );
}
