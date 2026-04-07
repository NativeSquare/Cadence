/**
 * SVG curved arch for section transitions (Runa-style).
 *
 * "top-into-dark" — light section curves INTO dark section (placed at top of dark section)
 * "bottom-into-light" — dark section curves INTO light section (placed at bottom of dark section)
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
    // Light-colored arch hanging down into dark section
    return (
      <div className="absolute left-0 top-0 z-10 w-full">
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

  // Dark-colored arch pushing up into light section
  return (
    <div className="absolute bottom-0 left-0 z-10 w-full">
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
