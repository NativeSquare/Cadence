/**
 * SVG curved arch for section transitions.
 * Hidden on mobile, visible from md breakpoint (768px+).
 */

interface SectionArchProps {
  variant: "top-into-dark" | "bottom-into-light";
  darkColor?: string;
  lightColor?: string;
}

export function SectionArch({
  variant,
  darkColor = "#121212",
  lightColor = "#f3f3f3",
}: SectionArchProps) {
  if (variant === "top-into-dark") {
    return (
      <div className="absolute left-0 top-0 z-10 hidden w-full md:block">
        <svg
          className="block w-full"
          viewBox="0 0 1440 72"
          fill="none"
          preserveAspectRatio="none"
          style={{ height: "72px" }}
        >
          <path
            d="M0 0C0 0 360 72 720 72C1080 72 1440 0 1440 0V0H0V0Z"
            fill={lightColor}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 z-10 hidden w-full md:block">
      <svg
        className="block w-full"
        viewBox="0 0 1440 72"
        fill="none"
        preserveAspectRatio="none"
        style={{ height: "72px" }}
      >
        <path
          d="M0 72C0 72 360 0 720 0C1080 0 1440 72 1440 72V72H0V72Z"
          fill={darkColor}
        />
      </svg>
    </div>
  );
}
