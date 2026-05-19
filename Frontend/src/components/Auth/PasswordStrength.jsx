const checks = [
  [/^.{8,}$/, "8+ characters"],
  [/[A-Z]/, "Uppercase"],
  [/[a-z]/, "Lowercase"],
  [/[0-9]/, "Number"],
];

const PasswordStrength = ({ password }) => {
  const score = checks.filter(([pattern]) => pattern.test(password)).length;
  const width = `${(score / checks.length) * 100}%`;
  const color = score <= 1 ? "bg-red-400" : score === 2 ? "bg-orange-400" : "bg-green-600";

  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width }} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {checks.map(([pattern, label]) => (
          <span key={label} className={pattern.test(password) ? "text-green-700" : ""}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;
